import codecs
import os
import requests
import dateutil.parser

search_uri_base = 'http://api.nytimes.com/svc/search/v2/articlesearch.json'
search_api_key = "DBDF5A27451085ED9FC599DED425F0E4:8:53409433"
query_hits_limit = 1000
query_pages_limit = 100
debug = True

root_folder_path = "/Users/kohlmannj/Desktop/article_search_api/"

def query(fq, qname):
	# Do nothing if the query is invalid
	if fq is None or fq == "":
		return None
	# Create a dict to contain the query
	query_params = {
		"fq": fq
	}
	query_dir = os.path.join(root_folder_path, qname)
	# Determine the start and end dates for this query.
	oldest_first_page_0 = fetch_pages_for_query({
		"fq": fq
		"sort": "oldest"
	}, None, 0)[0]
	newest_first_page_0 = fetch_pages_for_query({
		"fq": fq,
		"sort": "newest"
	}, None, 0)[0]

	# Get the earliest (start) date for the query
	query_start_date_str = oldest_first_page_0["response"]["docs"][0]["pub_date"]
	query_start_date = dateutil.parser.parse(query_start_date_str)
	# Get the latest (end) date for the query
	query_end_date_str = newest_first_page_0["response"]["docs"][0]["pub_date"]
	query_end_date = dateutil.parser.parse(query_end_date_str)
	# Get the number of hits and the number of result pages we'd need to fetch to get them all
	query_hits = oldest_first_page_0["response"]["meta"]["hits"]
	query_pages = query_hits / 10

	# We can only get 1,000 results per query out of the NYT Article Search API.
	# If we're under that limit, run the query as a single multi-page query.
	if query_pages <= query_pages_limit:
		return fetch_single_multipage_query(
			query_params,
			query_dir
		)
	else:
		query_params["begin_date"] = query_start_date.strftime("%Y%m%d")
		query_params["end_date"] = query_end_date.strftime("%Y%m%d")
		year_range = range(query_start_date.year, query_end_date + 1, 1)

		for year in year_range:
			query_year_dir = os.path.join(query_dir, str(year))
			# Assume that the number of results 
			return 

		return fetch_multipage_queries_by_year(
			query_params,
			query_dir
		)

def fetch_single_multipage_query(query_params, folder_path):
	return fetch_pages_for_query({
		"fq": fq
	}, folder_path)

def fetch_pages_for_query(query_params, folder_path = None, page_max = query_pages_limit):
	"""
	Returns a list of either the JSON result dicts of a query or a list of file
	paths to JSON files containing the query results.
	"""
	# Add the API key to the query parameters
	if "api-key" not in query_params:
		query_params["api-key"] = search_api_key
	# Set the query to default to sorting by oldest first
	if "sort" not in query_params:
		query_params["sort"] = "oldest"

	# Store the file paths or JSON result dicts from each page of the query
	return_value = []

	for i in range(0, page_max + 1):
		# Add in / update the page number to the query parameters
		query_params["page"] = i
		# Request the query from NYT
		response = requests.get(
			search_uri_base,
			params=query_params
			# headers={'User-Agent': user_agent})
		)

		# If we were given a folder path, return the path to the file we write
		if folder_path is not None:
			# Make up a filename
			filename = "results_%d.json" % i
			filepath = os.path.join(folder_path, filename)

			# Write the result to a file
			with codecs.open(filepath, mode="w", encoding="utf-8") as fileobj:
				fileobj.write( response.text )

			return_value.append(filepath)
		# Otherwise, return the response JSON
		else:
			return_value.append( response.json() )
	# All done, return the list
	return return_value
