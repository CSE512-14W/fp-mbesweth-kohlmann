# coding=utf-8
__author__ = 'kohlmannj'

import codecs
import os
import json
import requests
import dateutil.parser
from calendar import monthrange
from copy import deepcopy
import math
import tempfile
import hashlib
import re
import string


class ArticleSearch(object):

    # Some constants based on the NYT Article Search API documentation
    search_uri_base = 'http://api.nytimes.com/svc/search/v2/articlesearch.json'
    query_pages_limit = 100
    query_results_per_page = 10
    query_hits_limit = query_pages_limit * query_results_per_page
    # Fail on queries with more than this number of results
    query_max_hits = 8000

    @staticmethod
    def get_hash_for_query(**query_params):
        """
        Hash the query params for use in a rudimentary caching scheme.
        """
        lame_hash = hashlib.sha1()
        hash_valid = False
        if "q" in query_params and (
            type(query_params["q"]) is unicode or
            type(query_params["q"]) is str
        ):
            no_whitespace = re.sub("[\s]", "", query_params["q"].lower(), re.UNICODE)
            lame_hash.update(
                u"q" + unicode(no_whitespace)
            )
            hash_valid = True
        if "fq" in query_params and (
            type(query_params["fq"]) is unicode or
            type(query_params["fq"]) is str
        ):
            # Get rid of spaces and punctuation
            no_whitespace = re.sub("[\s]", "", query_params["fq"].lower(), re.UNICODE)
            lame_hash.update(
                u"fq" + unicode(no_whitespace)
            )
            hash_valid = True
        # Generate a 16-character query name based on this hash.
        qname = lame_hash.hexdigest()[:16]
        if hash_valid:
            return qname
        else:
            return None

    def __init__(self, **kwargs):
        # Root Folder Path (for file storage)
        self.root_path = None
        # Set self.root_path if the root_path kwarg given exists and is a
        # directory or does not exist.
        if "root_path" in kwargs and (
            (os.path.exists(kwargs["root_path"]) and os.path.isdir(kwargs["root_path"])) or
            not os.path.exists(kwargs["root_path"])
        ):
            self.root_path = kwargs["root_path"]
        # If self.root_path isn't set, generate a temp folder path.
        if self.root_path is None:
            temp_dir = tempfile.gettempdir()
            self.root_path = os.path.join(temp_dir, "ArticleSearch")
        # Create the root folder path if it doesn't exist.
        if not os.path.exists(self.root_path):
            os.makedirs(self.root_path)

        # Request Timeout
        if "request_timeout" in kwargs:
            self.request_timeout = kwargs["request_timeout"]
        else:
            # Just use 10 seconds
            self.request_timeout = 10

        # Max request attempts
        if "max_request_attempts" in kwargs:
            self.max_request_attempts = kwargs["max_request_attempts"]
        else:
            # Just use 50, that ought to be enough
            self.max_request_attempts = 50

        # Search URI Base
        if "search_uri_base" in kwargs:
            self.search_uri_base = kwargs["search_uri_base"]
        else:
            self.search_uri_base = ArticleSearch.search_uri_base
        # Search API Key
        if "search_api_key" in kwargs:
            self.search_api_key = kwargs["search_api_key"]
        else:
            raise ValueError("No NYT Search API key provided.")

        # Debug
        if "debug" in kwargs:
            self.debug = kwargs["debug"]
        else:
            self.debug = False

        # Limit Queries
        if "limit_queries" in kwargs:
            self.limit_queries = kwargs["limit_queries"]
        else:
            # Default to True since retrieving article data for more than 8000 results is prohibitive
            self.limit_queries = True

        # Replace existing cache files
        if "replace_existing_cache_files" in kwargs:
            self.replace = kwargs["replace_existing_cache_files"]
        else:
            self.replace = False

    def search(self, **query_params):
        """
        Any and all query parameters are technically supported, but the queries
        must contain either q or fq keys.
        """
        # Hash the query params to come up with a filename for this query.
        qname = self.get_hash_for_query(**query_params)
        if qname is None:
            raise ValueError("Something went wrong with hashing, so we have an invalid query")
        # Get the query filename as might exist on disk
        query_filename, query_path = self.get_query_filename(qname)
        # Try to return early if the cache file already exists
        if not self.replace and os.path.exists(query_path) and os.path.isfile(query_path):
            if self.debug:
                print "Returning early because we have this query result cached! '%s'" % query_filename
            return query_path
        if self.debug and self.replace and os.path.exists(query_path) and os.path.isfile(query_path):
            print "Replacing existing file '%s'" % query_path
        if self.debug:
                print "'%s' didn't exist, so we're fetching the results live from the New York Times API." % query_filename
        # Set query_params["sort"] to "oldest". There are certain assumptions
        # made about the data we're getting back, and chronological order is
        # one of them. No exceptions.
        query_params["sort"] = "oldest"
        # First try the query without any date limits to figure out how many hits there are.
        ir_stats = self.fetch_query_stats_dict(**query_params)
        if ir_stats["hits"] == 0:
            if self.debug:
                print "No hits for query '%s'" % query_params
            return None
        elif self.limit_queries and ir_stats["hits"] > self.query_max_hits:
            if self.debug:
                print "More than %d hits (%d hits, to be exact) for query '%s'" % (self.query_max_hits, ir_stats["hits"], query_params)
            return None
        elif self.debug:
            print "%d hits for query '%s'" % (ir_stats["hits"], query_params)
        page_range = range(0, ir_stats["pages"] + 1, 1)
        # Are there few enough hits than we can retrieve them with multiple pages of this query?
        if ir_stats["pages"] <= self.query_pages_limit:
            results = self.fetch_query_pages(
                page_range=page_range,
                **query_params
            )
        # Nope, we'll have to fetch all the results.
        else:
            # We already know the begin date from the inital response (ir)
            begin_date = dateutil.parser.parse( ir_stats["first_pub_date_str"] )
            # We do not know the end date yet, so do another request.
            newest_first_query_params = deepcopy(query_params)
            newest_first_query_params["sort"] = "newest"
            newest_first_result_stats = self.fetch_query_stats_dict(**newest_first_query_params)
            end_date = dateutil.parser.parse( newest_first_result_stats["first_pub_date_str"] )
            if self.debug:
                print str(query_params) + " beginning and ending dates: " + begin_date.isoformat() + " to " + end_date.isoformat()
            # Get the results in a way-too-clever way
            results = self.fetch_query_pages_by_year(
                begin_date=begin_date,
                end_date=end_date,
                **query_params
            )
        try:
            # Write the results to a JSON file
            query_path = self.write_results(results, qname)
            if self.debug:
                print "Wrote file: " + query_path
            # Return the path to the JSON file
            return query_path
        except NameError:
            if self.debug:
                print "No results for query."
            return None

    def get_query_filename(self, qname):
        query_filename = qname + ".json"
        query_path = os.path.join(self.root_path, query_filename)
        return query_filename, query_path

    def write_results(self, results, qname):
        # Get the query filename
        query_filename, query_path = self.get_query_filename(qname)
        # Write the results as a JSON string to a file
        with codecs.open(query_path, mode="w", encoding="utf-8") as fileobj:
            fileobj.write( json.dumps(results["docs"]) )
        # Return the file path
        return query_path

    def fetch_query_stats_dict(self, **query_params):
        """Note: every time this function is called, technically we're wasting a query."""
        r = self.fetch_query(**query_params)
        r_json = r.json()
        r_hits = r_json["response"]["meta"]["hits"]
        first_pub_date_str = None
        if len(r_json["response"]["docs"]) > 0:
            first_pub_date_str = r_json["response"]["docs"][0]["pub_date"]
        return {
            "hits": r_hits,
            "pages": int( math.ceil( float(r_hits) / float(self.query_results_per_page) ) ),
            "first_pub_date_str": first_pub_date_str
        }

    def fetch_query(self, **query_params):
        # Add the API key to the query parameters
        if "api-key" not in query_params:
            query_params["api-key"] = self.search_api_key
        # Set the query to default to sorting by oldest first
        if "sort" not in query_params:
            query_params["sort"] = "oldest"
        # Get the response
        response = requests.get(
            self.search_uri_base,
            params=query_params,
            timeout=self.request_timeout
            # headers={'User-Agent': user_agent})
        )
        # Return the response
        return response

    def fetch_query_pages_for_year_by_month(self, year, **query_params):
        results = {
            "docs": []
        }
        for this_month in range(1, 12 + 1):
            this_month_range = monthrange(year, this_month)
            query_params["begin_date"] = "%04d%02d%02d" % (year, this_month, this_month_range[0])
            query_params["end_date"] = "%04d%02d%02d" % (year, this_month, this_month_range[1])
            month_stats = self.fetch_query_stats_dict(**query_params)
            month_hits = month_stats["hits"]
            if month_hits == 0:
                if self.debug:
                    print "No hits for query '%s' in the year %d and month %d." % (query_params["fq"], year, this_month)
                continue
            page_range = range(0, month_stats["pages"] + 1)
            month_results = self.fetch_query_pages(page_range=page_range, **query_params)
            # Append the docs to the results["docs"] list
            results["docs"] += month_results["docs"]
            # Print a debug message
            if self.debug:
                print "Fetched %d query hits (%d pages) for the %04d-%02d." % (
                    month_stats["hits"],
                    month_stats["pages"],
                    year,
                    this_month
                )
        # All done
        return results

    def fetch_query_pages_by_year(self, begin_date, end_date, **query_params):
        results = {
            "docs": []
        }
        begin_year = begin_date.year
        end_year = end_date.year

        year_range = range(begin_year, end_year + 1, 1)
        for this_year in year_range:
            query_params["begin_date"] = "%04d0101" % this_year
            query_params["end_date"] = "%04d1231" % this_year
            year_stats = self.fetch_query_stats_dict(**query_params)
            year_hits = year_stats["hits"]
            # Skip this year if there are no hits for the query in this year.
            if year_hits == 0:
                if self.debug:
                    print "No hits for query '%s' in the year %d." % (query_params["fq"], this_year)
                continue
            year_pages = year_stats["pages"]
            # If there are more than 1000 results for the query on this particular year,
            # query by individual month instead.
            if year_pages > self.query_pages_limit:
                results["docs"] += self.fetch_query_pages_for_year_by_month(this_year, **query_params)["docs"]
            else:
                # Fetch all the results for this year.
                page_range = range(0, year_stats["pages"] + 1)
                year_results = self.fetch_query_pages(page_range=page_range, **query_params)
                # Append the docs to the results["docs"] list
                results["docs"] += year_results["docs"]
                # Print a debug message
                if self.debug:
                    print "Fetched %d query hits (%d pages) for the year %d." % (
                        year_stats["hits"],
                        year_stats["pages"],
                        this_year
                    )
        # All done.
        return results

    def fetch_query_pages(self, page_range=range(0, query_pages_limit + 1, 1), **query_params):
        # Add the API key to the query params
        query_params['api-key'] = self.search_api_key
        # Store the results
        results = {
            "docs": []
        }
        for page in page_range:
            # Add the page number to the query params
            query_params['page'] = page
            # Make the request
            response_status = None
            response_tries = 0
            while response_status != 200 and response_tries < self.max_request_attempts:
                response = requests.get(
                    self.search_uri_base,
                    params=query_params,
                    # Wait five additional seconds for each failed response
                    timeout=self.request_timeout + response_tries * 5
                )
                response_status = response.status_code
                response_tries += 1
            if response.status_code != 200:
                raise ValueError("Could not retrieve query from NYT!")
            # Append the docs list in the JSON dict to the results list
            results["docs"] += response.json()["response"]["docs"]
        # All done.
        return results
