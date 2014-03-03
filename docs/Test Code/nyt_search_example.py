import codecs
import os
import requests

page_max = 101  # NYT Article Search API only supports retrieving the first 100 pages of results
search_uri_base = 'http://api.nytimes.com/svc/search/v2/articlesearch.json'
search_api_key = "DBDF5A27451085ED9FC599DED425F0E4:8:53409433"
folder_path = "/Users/kohlmannj/Desktop/article_search_api/"

for i in range(0,101):
	# Make up a filename
	filename = "results_%d.json" % i
	filepath = os.path.join(folder_path, filename)

	# Request the query from NYT
	response = requests.get(
		search_uri_base,
		params={
			"fq": 'persons:("Obama, Barack")',
			"sort": "newest",
			"page": i,
			"api-key": search_api_key
		}  #,
		# headers={'User-Agent': user_agent})
	)

	# Write the result to a file
	with codecs.open(filepath, mode="w", encoding="utf-8") as fileobj:
		fileobj.write( response.text )

	print "Fetched and saved '%s'." % filename
