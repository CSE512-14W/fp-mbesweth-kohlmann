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


def reduce_by_year_with_multimedia(input_path, output_dir):
    # Get the input filename and stuff
    input_filename = os.path.basename(input_path)
    input_splitext = os.path.splitext(input_filename)
    # Did we already reduce this data? Figure out what the output path would be...
    output_filename = input_splitext[0] + "_reduce_by_year_with_multimedia" + input_splitext[1]
    output_path = os.path.join(output_dir, output_filename)
    # Does that file already exist?
    if os.path.exists(output_path) and os.path.isfile(output_path):
        if debug:
            print "Early return: we've already reduced the input file!"
        return output_path
    # Beyond here, we've got to actually do the reduction
    # Read in the input file.
    json_data = get_input_json(input_path)
    # Reduce the data into a new JSON file:
    new_data = OrderedDict()
    for article in json_data:
        # Get the article year
        article_date = dateutil.parser.parse(article["pub_date"])
        article_year = article_date.year
        # Determine if the year is already a key in new_data
        if article_year not in new_data:
            new_data[article_year] = []
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
                    flat_keyword = u"fq=%s:(%s)" % (keyword["name"], keyword["value"])
                    flat_keywords.append(flat_keyword)
        # Get the multimedia from the original article data
        thumbnail_url = None
        if "multimedia" in article and len(article["multimedia"]) > 0:
            for index, multimedia in enumerate(article["multimedia"]):
                # Skip the multimedia item if it doesn't have a "url" key. Yikes.
                if "url" not in multimedia:
                    continue
                # Get the very first multimedia item so we at least have something
                if index == 0:
                    thumbnail_url = u"http://nyt.com/%s" % multimedia["url"]
                # Prefer thumbnail multimedia
                if "subtype" in multimedia and multimedia["subtype"] == "thumbnail":
                    thumbnail_url = "http://nyt.com/" + multimedia["url"]
                    break
        # Prepare a dict with all the article data we care about
        new_article_data = {
            "pub_date": article["pub_date"],
            "main_headline": article["headline"]["main"],
            "web_url": article["web_url"],
            "original_byline": byline,
            "_id": article["_id"],
            "keywords": flat_keywords,
            "multimedia_url": thumbnail_url
        }
        # Append the reduced data to the new_data structure (by year)
        new_data[article_year].append(new_article_data)
    # Reformulate the OrderedDict into a list of dicts
    data_list = []
    for year, year_docs in new_data.items():
        # Count the most popular keywords in this year's articles
        year_keywords_counter = Counter()
        for year_doc in year_docs:
            year_keywords_counter += Counter(year_doc["keywords"])
        # Get the top and bottom 10 keywords
        most_common_keywords = year_keywords_counter.most_common(10)
        least_common_keywords = least_common_values(year_keywords_counter, 10)
        # Reformulate this year's data as a dict
        year_list_entry = {
            "year": year,
            "docs": year_docs,
            "hits": len(year_docs),
            "most_common_keywords": most_common_keywords,
            "least_common_keywords": least_common_keywords
        }
        data_list.append(year_list_entry)
        if debug:
            print "Calculated aggregate data for %d" % year
    # Output data_list as JSON to a new file
    output_filename = input_splitext[0] + "_reduce_by_year_with_multimedia" + input_splitext[1]
    output_path = os.path.join(output_dir, output_filename)
    with codecs.open(output_path, mode="w", encoding="utf-8") as fileobj:
        fileobj.write( json.dumps(data_list) )
    if debug:
        print "%s reduced to new file: %s" % (input_path, output_path)
    # Return the path to said file
    return output_path


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
