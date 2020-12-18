function formatDescription(desc) {
    // Replace all headlines
    desc = desc.replace(new RegExp('####.*', 'g'), function (x) {
        return '<h4>' + x.substring(3, x.length) + '</h4>'
    })
    desc = desc.replace(new RegExp('###.*', 'g'), function (x) {
        return '<h3>' + x.substring(3, x.length) + '</h3>'
    })
    desc = desc.replace(new RegExp('##.*', 'g'), function (x) {
        return '<h2>' + x.substring(3, x.length) + '</h2>'
    })

    // code
    desc = desc.replace(new RegExp('`.*`', 'g'), function (x) {
        return '<code>' + x.substring(1, x.length - 1) + '</code>'
    })
    // fat, cursive
    desc = desc.replace(new RegExp('\\*\\*.*\\*\\*', 'g'), function (x) {
        return '<b>' + x.substring(2, x.length - 2) + '</b>'
    })
    desc = desc.replace(new RegExp('_.*_', 'g'), function (x) {
        return '<i>' + x.substring(1, x.length - 1) + '</i>'
    })
    // links
    desc = desc.replace(new RegExp('\\[.*\\]\\(.*\\)', 'g'), function (x) {
        return (
            '<a href="' +
            x.substring(x.search(']') + 2, x.length - 1) +
            '">' +
            x.substring(1, x.search(']')) +
            '</a>'
        )
    })
    // Replace Linebreaks
    desc = desc.replace(new RegExp('\r?\n', 'g'), '<br>')

    return desc
}

class Feature {
    title = ''
    progressbar = ''
    mainbody = ''
    linksection = ''
    cardstatus = 'No progress information.'
    html = ''

    constructor(issue) {
        this.issue = issue
    }
    setCardStatus(status)
    {
        this.cardstatus = status;
    }
    formatContents() {
        if (this.issue != null) {
            // Title
            this.title =
                '<div><h2 style="display:inline;"><a href="' +
                this.issue.url +
                '">' +
                this.issue.title +
                '</a></h2>'
            if (this.issue.milestone != null) {
                if(this.issue.milestone.due_on != null) {
                    this.title +=
                        '<p style="display:inline; margin-left: 5%">ETA: ' +
                        this.issue.milestone.due_on.substring(0, 10) +
                        ' (' +
                        this.issue.milestone.title +
                        ')</p>'
                }
                else
                {
                    this.title +=
                        '<p style="display:inline; margin-left: 5%">ETA: ' +
                        this.issue.milestone.title +
                        '</p>'
                }
            }
            this.title += '</div>';

            // Progressbar
            // TODO: It would be nice if progress data would be directly fetched from Project Board for higher code reusability
            switch(this.cardstatus)
            {
                case 'Backlog':
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 0%"></span><span class="progressbartext">In Planung</span></div>';
                    break;
                case 'In Progress':
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 20%"></span><span class="progressbartext">Entwicklung</span></div>';
                    break;
                case 'Waiting':
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 40%"></span><span class="progressbartext">Entwicklung</span></div>';
                    break;
                case 'Review':
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 60%"></span><span class="progressbartext">Qualit&auml;tssicherung</span></div>';
                    break;
                case 'Testing':
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 80%"></span><span class="progressbartext">Qualit&auml;tssicherung</span></div>';
                    break;
                case 'Done':
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 100%"></span><span class="progressbartext">Fertig</span></div>';
                        break;
                default:
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 0%"></span><span class="progressbartext">Status unbekannt</span></div>';
            }
            // Body
            this.mainbody += '<h3>Beschreibung</h3>';
            if (this.issue.body.search('### Issuetracker Description') != -1) {
                this.mainbody += formatDescription(
                    this.issue.body.substring(
                        this.issue.body.search('### Issuetracker Description') + 28,
                        this.issue.body.length
                    )
                )
            } else {
                this.mainbody += '<p>Keine Spezielle Beschreibung gefunden. Folgende Beschreibung wurde aus dem zugeh&ouml;rigen GitHub-Issue generiert.<p><div style="border: 1px dashed gray;">' + formatDescription(this.issue.body) + '</div>';
            }

            // Links
            this.linksection += '<h3>Links</h3>'
            this.linksection += '<a href="' + this.issue.html_url + '" target="_blank">GitHub Issue (#' + this.issue.number + ')</a><br>'
        }
    }
}

function styleCollapsibles()
{
    const collapsibles = document.getElementsByClassName('collapsiblebtn')
    let i

    for(i = 0; i < collapsibles.length; i++)
    {
        collapsibles[i].addEventListener('click', function(){
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if(content != null)
            {
                if (content.style.maxHeight){
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }
        })
    }
}

function fetchIssues(url, parser, formatter)
{
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const myArr = JSON.parse(this.responseText)
            parser(myArr, formatter)
        }
        else if(this.readyState == 4)
        {
            console.log(this.status + ': ' + this.responseText)
            document.getElementById("errors").innerHTML += '<p>' + this.responseText + '</p>';
        }
    }
    xmlhttp.open('GET', url, true)
    xmlhttp.send()
}

function fetchCardStatus(feature, callback)
{
    url = 'https://api.github.com/repos/' + document.getElementById("targetrepo").value + '/issues/' + feature.issue.number + '/events?per_page=100';
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const myArr = JSON.parse(this.responseText)
            // Find the latest event of the desired type
            // technically the last entry should always be the most current, but it's definetely better to be safe than sorry
            let mostRecentDate = Date.parse('2000-01-01T00:00:01') // this should be far enough in the past
            let i
            for(i = 0; i < myArr.length; i++)
            {
                if(myArr[i].event != null && myArr[i].event == 'moved_columns_in_project')
                {
                    const eventDate = Date.parse(myArr[i].created_at)
                    if(mostRecentDate < eventDate)
                    {
                        mostRecentDate = eventDate;
                        if(myArr[i].project_card != null)
                        {
                            // only watch project "sprint backlog team interaction" and "sprint backlog team interaction"
                            // TODO: Move allowed projects outside or handle disallowed projects
                            if(myArr[i].project_card.project_id == 1195681 || myArr[i].project_card.project_id == 5529312)
                            {
                                feature.setCardStatus(myArr[i].project_card.column_name);
                            }
                        }
                    }
                }
            }
            callback(true, feature)
        }
        else if(this.readyState == 4)
        {
            console.log(this.status + ': ' + this.responseText)
            console.log(this);
            document.getElementById("errors").innerHTML += '<p>' + this.responseText + '</p>';
        }
    }
    xmlhttp.open('GET', url, true)
    // TODO: get Authentication from parameter
    xmlhttp.setRequestHeader("Authorization", 'token ' + document.getElementById('auth').value);
    xmlhttp.setRequestHeader("Accept", "application/vnd.github.starfox-preview+json");
    xmlhttp.send()
}

function parseIssues(arr, formatter) {
    const featurearray = []
    let i
    for (i = 0; i < arr.length; i++) {
        if (arr[i].pull_request == null) {
            featurearray.push(new Feature(arr[i]))
            fetchCardStatus(featurearray[featurearray.length -1], function(done, feature){
                if(done == true)
                {
                    formatFeature(feature)
                }
            });
        }
    }
}

function formatFeature(feature)
{
    // format feature divs
    feature.formatContents()
    feature.html = '<div class="feature"><button class="collapsiblebtn">' + feature.title + '<br>' + feature.progressbar +  '</button><div class="collapsiblecontent"><p>' + feature.mainbody + '</p><p>' + feature.linksection + '</p></div></div>'

    document.getElementById('maincontents').innerHTML += feature.html
    styleCollapsibles()
}

function fetchData()
{
    const url = 'https://api.github.com/repos/' + document.getElementById("targetrepo").value + '/issues?labels=bug&state=open&per_page=30';

    fetchIssues(url, parseIssues, formatFeature)

    // update request limit after some time
    // TODO: remove me sometime closer to release
    setTimeout(() => {
        updateRequestLimit("")
    }, 2000);
}

function updateRequestLimit(auth)
{
    const xmlhttp = new XMLHttpRequest()
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const res = JSON.parse(this.responseText);
            document.getElementById("remainingRequests").innerText = 'Remaining requests this hour: ' + res.rate.remaining + ' / ' + res.rate.limit;
        }
        else if(this.readyState == 4 && this.status == 403)
        {
            console.log(this.responseText)
            console.log(this);
            document.getElementById("errors").innerHTML += '<p>' + this.responseText + '</p>';
        }
    }
    xmlhttp.open('GET', 'https://api.github.com/rate_limit', true)
    if(auth != "")
    {
        xmlhttp.setRequestHeader("Authorization", 'token ' + auth);
    }
    xmlhttp.send()
}