import codecs
import os
import json
import requests
import dateutil.parser

root_folder_path = "/Users/kohlmannj/Desktop/article_search_api/"
search_uri_base = 'http://api.nytimes.com/svc/search/v2/articlesearch.json'
search_api_key = "DBDF5A27451085ED9FC599DED425F0E4:8:53409433"
query_pages_limit = 100
query_results_per_page = 10
query_hits_limit = query_pages_limit * query_results_per_page
debug = True

def fetch_results(fq, qname):
    if fq is None or fq == "":
        raise ValueError("fq is invalid")
    if qname is None or qname == "":
        raise ValueError("qname is invalid")
    # Save the query_params
    query_params = {
        "fq": fq
    }
    ######################################
    #### Get the inital response (ir) ####
    ######################################
    # First try the query without any date limits to figure out how many hits there are.
    ir_stats = fetch_query_stats_dict(query_params)
    page_range = range(0, ir_stats["pages"])
    # Are there few enough hits than we can retrieve them with multiple pages of this query?
    results = {}
    if ir_stats["pages"] <= query_pages_limit:
        results = fetch_query_pages(
            query_params=query_params,
            path=None,
            page_range=page_range
        )
    # Nope, we'll have to use a binary tree to fetch all the results
    else:
        # We already know the begin date from the inital response (ir)
        begin_date = dateutil.parser.parse( ir_stats["first_pub_date_str"] )
        # We do not know the end date yet, so do another request.
        newest_first_result_stats = fetch_query_stats_dict({
            "fq": fq,
            "sort": "newest"
        })
        end_date = dateutil.parser.parse( newest_first_result_stats["first_pub_date_str"] )
        if debug:
            print fq + " beginning and ending dates: " + begin_date.strftime("%Y-%m-%d") + " to " + end_date.strftime("%Y-%m-%d")
        # Get the results in a way-too-clever way
        results = fetch_query_pages_by_year(
            query_params=query_params,
            begin_date=begin_date,
            end_date=end_date
        )
    if results == {}:
        raise ValueError("No results?")
    # Write the results to a JSON file
    query_path = write_results(results, qname, root_folder_path)
    return query_path

def write_results(results, qname, path):
    # Create the destination path (assumed to be a folder) if it doesn't exist
    if not os.path.exists(path):
        os.makedirs(path)
    # Make up a fileb=name
    query_filename = qname + ".json"
    query_path = os.path.join(root_folder_path, query_filename)
    # Write the results as a JSON string to a file
    with codecs.open(query_path, mode="w", encoding="utf-8") as fileobj:
        fileobj.write( json.dumps(results) )
    # Return the file path
    return query_path

def fetch_query_stats_dict(query_params):
    r = fetch_query(query_params)
    r_json = r.json()
    r_hits = r_json["response"]["meta"]["hits"]
    return {
        "hits": r_hits,
        "pages": r_hits / query_results_per_page
        "first_pub_date_str" = r_json["response"]["docs"][0]["pub_date"]
    }

def fetch_query(query_params):
    # Add the API key to the query parameters
    if "api-key" not in query_params:
        query_params["api-key"] = search_api_key
    # Set the query to default to sorting by oldest first
    if "sort" not in query_params:
        query_params["sort"] = "oldest"
    # Get the response
    response = requests.get(
        search_uri_base,
        params=query_params
        # headers={'User-Agent': user_agent})
    )
    # Return the response
    return response

def fetch_query_pages_by_year(query_params, begin_date, end_date):
    results = {
        "docs": []
    }
    begin_year = begin_date.year
    end_year = end_date.year

    year_range = range(begin_year, end_year, 1)
    for year in year_range:
        query_params["begin_date"] = "%d0101" % year
        query_params["begin_date"] = "%d1231" % year
        year_range_stats = fetch_query_stats_dict(query_params)
        # If there are more than 1000 results for the query on this particular year, let us know.
        if year_range_stats["pages"] > query_pages_limit:
            raise ValueError("Wow, more than 1000 results for the query in the year %d" % year)
        # Fetch all the results for this year.
        year_results = fetch_query_pages(query_params, range(0, year_range_stats["pages"] + 1))
        # Append the docs to the results["docs"] list
        results["docs"] += year_results["docs"]
        # Print a debug message
        if debug:    
            print "Fetched %d query hits (%d pages) for the year %d." % (
                year_range_stats["hits"],
                year_range_stats["pages"],
                year
            )
    # All done.
    return results

def fetch_query_pages(query_params, page_range=range(0, query_pages_limit + 1)):
    # Create the destination folder if it doesn't exist
    if path is not None and not os.path.exists(path):
        os.makedirs(path)
    # Add the API key to the query params
    query_params['api-key'] = search_api_key
    # Store the results
    results = {
        "docs": []
    }
    for page in page_range:
        # Add the page number to the query params
        query_params['page'] = page
        # Make the request
        response = requests.get(
            search_uri_base,
            params=query_params
        )
        # Append the docs list in the JSON dict to the results list
        results["docs"] += response.json()["response"]["docs"]
    # All done.
    return results
