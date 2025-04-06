document.addEventListener("DOMContentLoaded", () => {
    fetchEmails();

    document.getElementById("load-more").addEventListener("click", () => {
        const count = document.querySelectorAll("#website-list li").length;
        fetch("/load_more", {
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `count=${count}`
        })
        .then(res => res.text())
        .then(html => {
            const list = document.getElementById("website-list");
            list.insertAdjacentHTML("beforeend", html);
            fetchEmails();
        });
    });

    document.getElementById("show-analysis").addEventListener("click", () => {
        fetch("/get_analysis_data")
            .then(res => res.json())
            .then(data => {
                const ctx = document.getElementById("chart").getContext("2d");
                new Chart(ctx, {
                    type: "pie",
                    data: {
                        labels: ["Websites with Email", "No Email Found"],
                        datasets: [{
                            data: [data.success, data.fail],
                            backgroundColor: ["#4caf50", "#f44336"]
                        }]
                    }
                });
            });
    });
});

function fetchEmails() {
    document.querySelectorAll("#website-list li").forEach(li => {
        const index = li.dataset.index;
        const emailSpan = li.querySelector(".emails");
        if (!emailSpan.textContent.includes("@")) {
            fetch("/get_emails", {
                method: "POST",
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: `url=${li.querySelector("a").href}&index=${index}`
            })
            .then(res => res.json())
            .then(data => {
                if (data.emails.length > 0) {
                    emailSpan.textContent = "Emails: " + data.emails.join(", ");
                } else {
                    emailSpan.textContent = "No emails found";
                }
            });
        }
    });
}
