import matplotlib.pyplot as plt
import os
from flask import Flask, render_template, request, jsonify
from scraper import get_edu_websites, extract_emails_from_site
import threading

app = Flask(__name__)

scraped_data = []
success_count = 0
fail_count = 0

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/scrape")
def scrape():
    global scraped_data, success_count, fail_count
    scraped_data = get_edu_websites()
    for site in scraped_data:
        site["emails"] = []
    success_count = 0
    fail_count = 0
    visible_websites = scraped_data[:10]
    return render_template("results.html", websites=visible_websites, visible_count=len(visible_websites))

    

@app.route("/load_more", methods=["POST"])
def load_more():
    count = int(request.form.get("count", 0))
    new_websites = scraped_data[count:count + 10]
    return render_template("website_list.html", websites=new_websites, loaded_count=count)



@app.route("/get_emails", methods=["POST"])
def get_emails():
    global success_count, fail_count
    url = request.form["url"]
    index = int(request.form["index"])
    emails = extract_emails_from_site(url)
    scraped_data[index]["emails"] = emails
    if emails:
        success_count += 1
    else:
        fail_count += 1
    return jsonify({"emails": emails})

# @app.route("/analysis")
# def analysis():
#     websites = scraped_data  # make sure this is global or shared
#     total = len(websites)
#     success = sum(1 for w in websites if w['emails'])
#     fail = total - success
#     save_pie_chart(success, fail)

#     return render_template("analysis.html",
#                            total=total,
#                            success=success,
#                            fail=fail)

@app.route("/analysis", methods=["POST"])
def analysis():
    visible_count = int(request.form.get("visible_count", 10))
    visible_websites = scraped_data[:visible_count]

    total = len(visible_websites)
    success = sum(1 for site in visible_websites if site['emails'])
    failed = total - success

    # Pie chart logic here (e.g., save chart to static/chart.png)
    labels = ['Success (≥1 Email)', 'Failed (0 Emails)']
    sizes = [success, failed]
    colors = ['#4CAF50', '#F44336']

    plt.figure(figsize=(6, 6))
    plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=140)
    plt.axis('equal')
    plt.tight_layout()
    chart_path = os.path.join('static', 'chart.png')
    plt.savefig(chart_path)
    plt.close()

    return render_template("analysis.html", total=total, success=success, failed=failed, chart_path=chart_path)




def save_pie_chart(success, fail):
    labels = ['Websites with Emails', 'Websites with 0 Emails']
    sizes = [success, fail]
    colors = ['#4CAF50', '#FF5733']
    explode = (0.1, 0)

    plt.figure(figsize=(6, 6))
    plt.pie(sizes, explode=explode, labels=labels, colors=colors,
            autopct='%1.1f%%', shadow=True, startangle=140)
    plt.title('Email Extraction Success Rate')
    plt.axis('equal')

    plt.savefig('static/email_analysis_pie_chart.png')
    plt.close()




if __name__ == "__main__":
    app.run(debug=True)
