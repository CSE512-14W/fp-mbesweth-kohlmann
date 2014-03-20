__author__ = 'kohlmannj'
import codecs
import json
import os
import dateutil.parser
from collections import OrderedDict, Counter

root_folder_path = "/Users/kohlmannj/Desktop/article_search_api/"
debug = True

# Least Common Values in a an array or Counter: http://stackoverflow.com/a/4743286

from operator import itemgetter
import heapq
import collections


multimedia_types = [
    "xlarge",
    ""
]


def least_common_values(counter, to_find=None):
    if to_find is None:
        return sorted(counter.items(), key=itemgetter(1), reverse=False)
    return heapq.nsmallest(to_find, counter.items(), key=itemgetter(1))

# End Least Common Values Snippet


def get_input_json(input_path):
    # Read in the input file.
    input_file = codecs.open(input_path, encoding="utf-8", mode="r")
    json_data = json.load(input_file)
    input_file.close()
    return json_data


def reduce(input_path, output_dir):
    # Get the input filename and stuff
    input_filename = os.path.basename(input_path)
    input_splitext = os.path.splitext(input_filename)
    # Read in the input file.
    json_data = get_input_json(input_path)
    # Reduce the data into a new JSON file
    new_data = []
    for article in json_data:
        abstract = None
        if "abstract" in article:
            abstract = article["abstract"]
        byline = None
        if "byline" in article and article["byline"] is not None and "original" in article["byline"]:
            byline = article["byline"]["original"]
        new_article_data = {
            "pub_date": article["pub_date"],
            "main_headline": article["headline"]["main"],
            "web_url": article["web_url"],
            "original_byline": byline,
            "abstract": abstract,
            "_id": article["_id"]
        }
        new_data.append(new_article_data)
    # Output a new file
    output_filename = input_splitext[0] + "_reduced" + input_splitext[1]
    output_path = os.path.join(output_dir, output_filename)
    with codecs.open(output_path, mode="w", encoding="utf-8") as fileobj:
        fileobj.write( json.dumps(new_data) )
    if debug:
        print "%s --> %s" % (input_path, output_path)
    return output_path


def reduce_by_year(input_path, output_dir):
    # Get the input filename and stuff
    input_filename = os.path.basename(input_path)
    input_splitext = os.path.splitext(input_filename)
    # Read in the input file.
    json_data = get_input_json(input_path)
    # Reduce the data into a new JSON file:
    new_data = {}
    for article in json_data:
        article_date = dateutil.parser.parse(article["pub_date"])
        article_year = article_date.year
        if article_year not in new_data:
            new_data[article_year] = []
        # Get the reduced set of data for this article
        byline = None
        if "byline" in article and article["byline"] is not None and "original" in article["byline"]:
            byline = article["byline"]["original"]
        new_article_data = {
            "pub_date": article["pub_date"],
            "main_headline": article["headline"]["main"],
            "web_url": article["web_url"],
            "original_byline": byline,
            "_id": article["_id"]
        }
        # Append the reduced data to the new_data structure (by year)
        new_data[article_year].append(new_article_data)
    # Output a new file
    output_filename = input_splitext[0] + "_reduced_by_year" + input_splitext[1]
    output_path = os.path.join(output_dir, output_filename)
    with codecs.open(output_path, mode="w", encoding="utf-8") as fileobj:
        fileobj.write( json.dumps(new_data) )
    if debug:
        print "%s --> %s" % (input_path, output_path)
    return output_path


def reduce_by_year_and_month_with_multimedia(input_path, output_dir, year_docs_limit=200):
    # File suffix
    file_suffix = "_reduce_by_year_and_month_with_multimedia"
    # Get the input filename and stuff
    input_filename = os.path.basename(input_path)
    input_splitext = os.path.splitext(input_filename)
    # Did we already reduce this data? Figure out what the output path would be...
    output_filename = input_splitext[0] + file_suffix + input_splitext[1]
    output_path = os.path.join(output_dir, output_filename)
    # Does that file already exist?
    if os.path.exists(output_path) and os.path.isfile(output_path):
        if debug:
            print "Early return: we've already reduced the input file!"
        return output_path
    # Beyond here, we've got to actually do the reduction
    # Read in the input file.
    json_data = get_input_json(input_path)
    # Figure out the range of years that the article list covers
    first_year = dateutil.parser.parse(json_data[0]["pub_date"]).year
    last_year = dateutil.parser.parse(json_data[-1]["pub_date"]).year
    year_range = range(first_year, last_year + 1, 1)
    new_data = OrderedDict()
    # Add keys and lists for each year in the year range into the OrderedDict
    for year in year_range:
        new_data[year] = []
    # Reduce the data into a new JSON file:
    for article in json_data:
        # Get the article year
        article_date = dateutil.parser.parse(article["pub_date"])
        article_year = article_date.year
        # Determine if the year is already a key in new_data
        if article_year not in new_data:
            raise ValueError("The year %d should absolutely be in new_data by now..." % article_year)
        # Get the snippet for the article
        snippet = None
        if "snippet" in article:
            snippet = article["snippet"]
        # Get the byline for the article
        byline = None
        if "byline" in article and article["byline"] is not None and "original" in article["byline"]:
            byline = article["byline"]["original"]
        # Get the keywords for the article
        keyword_names_to_skip = ["unknown", "type_of_material"]
        flat_keywords = []
        if "keywords" in article and len(article["keywords"]) > 0:
            for keyword in article["keywords"]:
                # Skip certain keywords with garbage formatting
                if (
                    "name" in keyword and type(keyword["name"]) in (str, unicode) and keyword["name"] not in keyword_names_to_skip and
                    "value" in keyword and type(keyword["value"]) in (str, unicode) and keyword["value"] != ""
                ):
                    flat_keyword = u'fq=%s:("%s")' % (keyword["name"], keyword["value"])
                    flat_keywords.append(flat_keyword)
        # Get the multimedia from the original article data
        multimedia_url = None

        multimedia_type = None
        if "multimedia" in article and len(article["multimedia"]) > 0:
            for index, multimedia in enumerate(article["multimedia"]):
                # Skip the multimedia item if it doesn't have a "url" key. Yikes.
                if "url" not in multimedia:
                    continue
                # Get the very first multimedia item so we at least have something
                if index == 0:
                    multimedia_url = multimedia["url"]
                # Get one particular multimedia entry
                if "subtype" in multimedia:
                    multimedia_url = multimedia["url"]
                    multimedia_type =  multimedia["subtype"]
                    # Prefer xlarge
                    if multimedia["subtype"] == "xlarge":
                        break
        # Add the domain and a protocol to the multimedia url
        if multimedia_url is not None and multimedia_url.startswith("images/"):
            multimedia_url = u"http://nyt.com/" + multimedia_url
        # Prepare a dict with all the article data we care about
        new_article_data = {
            "pub_date": article["pub_date"],
            "main_headline": article["headline"]["main"],
            "web_url": article["web_url"],
            # Removing this because it's too verbose and annoying to deal with
            # "original_byline": byline,
            "_id": article["_id"],
            "keywords": flat_keywords,
            "multimedia_url": multimedia_url,
            "multimedia_type": multimedia_type,
            "snippet": snippet
        }
        # Append the reduced data to the new_data structure (by year)
        new_data[article_year].append(new_article_data)
    # Reformulate the OrderedDict into a list of dicts
    all_years_keywords_counter = Counter()
    final_data = {
        "max_hits": 0,
        "years": [],
        "most_common_keywords": Counter(),
        "least_common_keywords": Counter()
    }
    # Handle each year and separate a year into months if it contains more articles than year_docs_limit
    for year, year_docs in new_data.items():
        # Update max_year_docs
        if len(year_docs) > final_data["max_hits"]:
            final_data["max_hits"] = len(year_docs)
        # Count the most popular keywords in this year's articles
        year_keywords_counter = Counter()
        year_by_month_docs = None
        # Set up the base data structure for the year in an eventual list in the final data structure
        year_list_entry = dict(
            year=year,
            docs=None,
            months=None,
            most_common_keywords=None,
            least_common_keywords=None,
            hits=len(year_docs),
            months_max_hits=None
        )
        # Separate the year into months if it contains more articles than year_docs_limit
        if len(year_docs) > year_docs_limit:
            # Separate into months
            year_by_month_docs, year_keywords_counter, months_max_hits = _output_year_by_month(year, year_docs)
            year_list_entry.update(
                months=year_by_month_docs,
                months_max_hits=months_max_hits
            )
        else:
            # Handle the year all at once
            for year_doc in year_docs:
                year_keywords_counter += Counter(year_doc["keywords"])
            year_list_entry.update(
                docs=year_docs
            )
        # Get the top and bottom 10 keywords for the year
        most_common_keywords = year_keywords_counter.most_common(10)
        least_common_keywords = least_common_values(year_keywords_counter, 10)
        # Reformulate this year's data as a dict
        year_list_entry.update(
            hits=len(year_docs),
            most_common_keywords=most_common_keywords,
            least_common_keywords=least_common_keywords
        )
        # Combine this year's data with the final data
        final_data["years"].append(year_list_entry)
        all_years_keywords_counter += year_keywords_counter
        if debug:
            print "Calculated aggregate data for %d" % year
    # Finish up with most and least common keywords
    final_data["most_common_keywords"] = all_years_keywords_counter.most_common(10)
    final_data["least_common_keywords"] = least_common_values(all_years_keywords_counter, 10)
    # Output data_list as JSON to a new file
    output_filename = input_splitext[0] + file_suffix + input_splitext[1]
    output_path = os.path.join(output_dir, output_filename)
    with codecs.open(output_path, mode="w", encoding="utf-8") as fileobj:
        fileobj.write(
            json.dumps(final_data)
        )
    if debug:
        print "%s reduced to new file: %s" % (input_path, output_path)
    # Return the path to said file
    return output_path


def _output_year_by_month(year, year_docs):
    year_by_month = []
    month_range = range(1, 13, 1)
    year_keywords_counter = Counter()
    months_max_hits = 0
    # Create a dict for each month in the year
    for month in month_range:
        month_dict = {
            "month": month,
            "year": year,
            "docs": [],
            "hits": None,
            "most_common_keywords": None,
            "least_common_keywords": None
        }
        year_by_month.append(month_dict)
    # Iterate through the docs and assign them to a month
    for article in year_docs:
        # Get the publication date as an actual date
        article_date = dateutil.parser.parse(article["pub_date"])
        article_year = article_date.year
        article_month = article_date.month
        if article_year != year or article_month not in month_range:
            raise ValueError("Trying to insert an article published %02d/%04d into articles for %04d, which makes no sense" % (
                article_month, article_year, year
            ))
        # Insert the article into year_by_month somewhere
        month_index = article_month - 1
        year_by_month[month_index]["docs"].append(article)
    # Get common keywords and hits for each month
    for month_dict in year_by_month:
        if len(month_dict["docs"]) > months_max_hits:
            months_max_hits = len(month_dict["docs"])
        month_keywords = Counter()
        month_dict["hits"] = len(month_dict["docs"])
        # Get keyword counts
        for month_doc in month_dict["docs"]:
            month_keywords += Counter(month_doc["keywords"])
        # Get the top and bottom ten keywords for the month
        month_dict["most_common_keywords"] = month_keywords.most_common(10)
        month_dict["least_common_keywords"] = least_common_values(month_keywords, 10)
        # Add this month's keywords counter to the year's keywords counter
        year_keywords_counter += month_keywords
    # Return some data structures
    return year_by_month, year_keywords_counter, months_max_hits


def reduce_by_year_minimal(input_path, output_dir):
    # Get the input filename and stuff
    input_filename = os.path.basename(input_path)
    input_splitext = os.path.splitext(input_filename)
    # Read in the input file.
    json_data = get_input_json(input_path)
    # Reduce the data into a new JSON file:
    new_data = {}
    for article in json_data:
        article_date = dateutil.parser.parse(article["pub_date"])
        article_year = article_date.year
        if article_year not in new_data:
            new_data[article_year] = []
        # Get the reduced set of data for this article
        new_article_data = {
            "pub_date": article["pub_date"],
            "main_headline": article["headline"]["main"],
            "_id": article["_id"]
        }
        # Append the reduced data to the new_data structure (by year)
        new_data[article_year].append(new_article_data)
    # Output a new file
    output_filename = input_splitext[0] + "_reduced_by_year_minimal" + input_splitext[1]
    output_path = os.path.join(output_dir, output_filename)
    with codecs.open(output_path, mode="w", encoding="utf-8") as fileobj:
        fileobj.write( json.dumps(new_data) )
    if debug:
        print "%s --> %s" % (input_path, output_path)
    return output_path
