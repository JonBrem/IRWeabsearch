package test;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import solr.SolrJConnection;
import solr.SolrJConnection.ResultsObject;


public class AjaxServerTest extends HttpServlet{
	private static final long serialVersionUID = 1L;
	
	private SolrJConnection connect;
	
	private boolean tagCloud = true;
	
	public AjaxServerTest() {
		super();
	}
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		connect = new SolrJConnection();
        
		if(request.getRequestURI().equals("/IRWebsearch/WebAppTest/suche")) {
			showResults(request, response);
		} else if(request.getRequestURI().equals("/IRWebsearch/WebAppTest")){
			doAutocomplete(request, response);
		}
	}
	
	// Breakpoints: FILTERS    RESULTS    OTHER TOPICS    PAGES
	private void showResults(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String relativeWebPath = "/suche.html";
		String absoluteDiskPath = getServletContext().getRealPath(relativeWebPath);
		
		String htmlPage = readFile(absoluteDiskPath, Charset.forName("utf-8"));
		PrintWriter out = response.getWriter();
		
		String page = request.getParameter("page");
		String query = new String(request.getParameter("q").getBytes(), "ISO-8859-1");

		addCookie(response, request, query);
		
		ResultsObject obj;
		
		if(page != null) {
			obj = connect.getResultsForQuery(query, Integer.parseInt(page));
		} else {
			obj = connect.getResultsForQuery(query);	
		}
		
		writeResults(obj, out, htmlPage, page, query, request.getCookies());
		
	}
	
	private void writeResults(ResultsObject obj, PrintWriter out, String htmlPage, String page, String query, Cookie[] recentSearches) {
		// Write Everything up to (including) filters
		int index = htmlPage.indexOf("<!-- BREAKPOINT: FILTERS -->");
		int nextIndex = htmlPage.indexOf("<!-- BREAKPOINT: RESULTS -->");
		out.write(htmlPage.substring(0, index));
		out.write(writeFilters(obj.numResults));
				
		// Write Everything up to (including) results
		out.write(htmlPage.substring(index, nextIndex));
		out.write(writeResults(obj.actualResults));
		index = nextIndex;
		nextIndex = htmlPage.indexOf("<!-- BREAKPOINT: OTHER TOPICS -->");

		// Write Everything up to (including) recent queries
		out.write(htmlPage.substring(index, nextIndex));
		//out.write(writeRelatedQueries(obj.relatedQueries));
		if(tagCloud) {
			out.write(writeTagcloud(obj.tagCloud));
		} else 
			try {
				out.write(writeRecentQueries(recentSearches));
			} catch (Exception e) {	
		}
		
		index = nextIndex + ("<!-- BREAKPOINT: OTHER TOPICS -->".length());
		nextIndex = htmlPage.indexOf("<!-- BREAKPOINT: PAGES -->");
				
		// Write Pagination
		out.write(htmlPage.substring(index, nextIndex));
		if(page != null) {
			out.write(writePages(obj.numResults, query, Integer.parseInt(page)));
		} else {
			out.write(writePages(obj.numResults, query, 1));
		}
		out.write(htmlPage.substring(nextIndex, htmlPage.length()-1));
	}
	
	private String writeFilters(int numResults) {
		return "<p>"+ numResults + " Ergebnisse</p>";
	}
	
	private String writeResults(String[][] results) {
		return getFormattedResults(results);
	}
	
	private String writeRelatedQueries(String[] relatedQueries) {
		return "";
	}
	
	private String writeRecentQueries(Cookie[] recentQueries) throws UnsupportedEncodingException {
		if(recentQueries == null || recentQueries.length == 0) return "";
		ArrayList<RecentSearch> recentSearches = new ArrayList<RecentSearch>();
		
		for(int i = 0; i < recentQueries.length; i++){
			Cookie rq = recentQueries[i];
			long queryDate = Long.parseLong(rq.getName().substring("query".length()));
			boolean alreadyCounted = false;
			for(int j = 0; j < recentSearches.size(); j++) {
				RecentSearch rs = recentSearches.get(j);
				if(rs.query.equals(URLDecoder.decode(rq.getValue(), "utf-8"))) {
					rs.counter++;
					if(rs.date > queryDate) { 
						rs.date = queryDate;
					}
					alreadyCounted = true;
					break;
				}
			}
			if(alreadyCounted) continue;
			recentSearches.add(new RecentSearch(URLDecoder.decode(rq.getValue(), "utf-8"), queryDate));
		} 
		Collections.sort(recentSearches);
		
		int displayedSearches = recentSearches.size() > 10? 10 : recentSearches.size();
		
		String s = 	"<h3>Zuletzt gesucht:</h3>";
		s += "<aside id='suggestions'>"
				+"<ul>";
			for(int i = 0; i < displayedSearches; i++) {
				s += "<li><a href='suche?q=" + recentSearches.get(i).query + "'>" + recentSearches.get(i).query + "</a></li>";
			}
		s += "</ul>"+
			"</aside>";
		
		return s;
	}
	
	private String writeTagcloud(List<TagcloudSuggestion> tags) {
		String tagCloud = "";
		double maxScore = tags.get(0).score;
		int maxTagCount = tags.size() > 50? 50 : tags.size();
		tags = (List<TagcloudSuggestion>) tags.subList(0, maxTagCount);
		TagcloudSuggestion.sortRandomly = true;
		Collections.sort(tags);
		
		tagCloud +="<aside id='tagCloud'>";
		
		for(int i = 0; i < maxTagCount; i++) {
			double fontSize = Math.pow(tags.get(i).score/maxScore, 4)*26;
			if(fontSize < 7) fontSize = 7;
			tagCloud += "<span style='font-size: " + 
		 fontSize + "pt;'><a href='suche?q=" + tags.get(i).name + "'>" 
		+ tags.get(i).name + "</a></span>";
		}
		
		tagCloud +="</aside>";
		return tagCloud;
	}
	
	
	private String writePages(int numResults, String query, int active) {
		String pagination = "";

		int startNumber;
		
		if(active <= 6) startNumber = 1;
		else startNumber = active - 5;
		
		int pageNumbersShown = numResults/10;
		if(pageNumbersShown > 10) pageNumbersShown = startNumber + 9;
		if(pageNumbersShown > numResults/10) pageNumbersShown = numResults/10 + 1;
		
		if(active != 1) {
			pagination += "<a class='active' href='suche?q=" + query + "&page=" + (active-1) + "'>&lt;</a>";	
		}
		
		for(int i = startNumber; i <= pageNumbersShown; i++) {
			if(i == active) {
				pagination += "<a class='active' href='suche?q=" + query + "&page=" + i + "'>" + i + "</a>";				 
			} else {
				pagination += "<a href='suche?q=" + query + "&page=" + i + "'>" + i + "</a>";
			}
		}
		
		
		if(active != numResults/10 + 1) {
			pagination += "<a class='active' href='suche?q=" + query + "&page=" + (active+1) + "'>&gt;</a>";	
		}
		
		return pagination;
	}
	
	private String getFormattedResults(String[][] queryResults) {
		String resultString = "<ul class='result-list'>";
        			
		for(int i = 0; i < queryResults.length; i++) {
			// so url doesn't need 2 lines
			queryResults[i][1] = queryResults[i][1].replaceAll("<strong>", "");
			queryResults[i][1] = queryResults[i][1].replaceAll("</strong>", "");
			if(queryResults[i][1].length() > 95){
			
				queryResults[i][1] = queryResults[i][1].substring(0, 90) + "...";
			}
			
			resultString += "<li><h3 class='result-title'><a href='" + queryResults[i][3] +  "'>" + queryResults[i][0] +
					"</a></h3><p class='result-url'>" + queryResults[i][1] +  
					"</p><p class='result-snippet'>" + queryResults[i][2] + "...</p></li>";
		}		
		resultString += "</ul>";
		
		resultString = new String(resultString.getBytes(), Charset.forName("ISO-8859-1"));
		return resultString;
	}
	
	private void doAutocomplete(HttpServletRequest request, HttpServletResponse response)  throws ServletException, IOException{

		response.setContentType("application/json");
		
		
        PrintWriter out = response.getWriter();
		
        String query = request.getParameter("query");
        
        SolrJConnection connect = new SolrJConnection();
		String[] suggestions = connect.getSuggestions(query);
		
		String resultString = "[";
		for(int i = 0; i < suggestions.length; i++) {
			resultString += "\"" +suggestions[i] + "\"";
			if(i != suggestions.length-1) resultString += ",";
		}
		resultString += "]";
		
		out.println("{");
		out.println("\"suggestions\":"+resultString);
		out.println("}");
		
		out.close();
	}
		
	private void addCookie(HttpServletResponse response, HttpServletRequest request, String query) throws UnsupportedEncodingException {
		Cookie searchCookie = new Cookie("query"+System.currentTimeMillis(), URLEncoder.encode(query, "UTF-8").replaceAll("\\+", "%20")
                .replaceAll("\\%21", "!")
                .replaceAll("\\%27", "'")
                .replaceAll("\\%28", "(")
                .replaceAll("\\%29", ")")
                .replaceAll("\\%7E", "~"));
		searchCookie.setMaxAge(24*60*60*9*30); // I.e. 1,5 semesters - should be more than enough.
	
		response.addCookie(searchCookie);
	}
	
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("text/html");
		response.getWriter().println("<responseFromServer>hi " + request.getParameter("name") + "</responseFromServer>");
		response.getWriter().close();
	}
	
	static String readFile(String path, Charset encoding) throws IOException {
		  byte[] encoded = Files.readAllBytes(Paths.get(path));
		  return new String(encoded, encoding);
	}
	
	
}
