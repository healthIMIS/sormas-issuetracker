const Config={
    'Projects' : [1195681, 5529312],
    'AllowedUserIDs' : [4655486],
    'AllowedLabels' : ['issuetracker']
}



function formatDescription(desc) {
    // Replace all headlines
    desc = desc.replace(new RegExp('#####.*', 'g'), function (x) {
        return '<h5>' + x.substring(6, x.length) + '</h5>'
    })
    desc = desc.replace(new RegExp('####.*', 'g'), function (x) {
        return '<h4>' + x.substring(5, x.length) + '</h4>'
    })
    desc = desc.replace(new RegExp('###.*', 'g'), function (x) {
        return '<h3>' + x.substring(4, x.length) + '</h3>'
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

    // images
    desc = desc.replace(new RegExp('\!\\[.*\]\\(.*\\)', 'g'), function (x) {
        return (
            '<a target="_blank" href="' + x.substring(x.search(']') + 2, x.length - 1) + '"><img src ="' +
            x.substring(x.search(']') + 2, x.length - 1) +
            '" alt="' +
            x.substring(2, x.search(']')) +
            '"></a>'
        )
    })

    // links
    desc = desc.replace(new RegExp('\\[.*\]\\(.*\\)', 'g'), function (x) {
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
    cardstatusdate = ''

    constructor(issue) {
        this.issue = issue
    }
    setComments(commentsArr){
        this.comments = commentsArr
    }
    setCardStatus(status, date)
    {
        const jsDate = new Date(date)
        this.cardstatusdate = jsDate.getDate() + '/' + jsDate.getMonth() + '/' + jsDate.getFullYear();
        this.cardstatus = status;
    }
    formatContents()
    {
        // Check comments for updated descriptions
        let latestCommentUpdateID = -1
        if(this.comments != null)
        {
            let i
            for(i = 0; i < this.comments.length; i++)
            {
                if(this.comments[i].body.search('### Issuetracker Description') != -1)
                {
                    // check if comment creator has the necessary rights
                    Config.AllowedUserIDs.forEach(ID => {
                        if(this.comments[i].user.id == ID) {
                            latestCommentUpdateID = i
                        }
                    })
                }
            }
        }
        // Create content from Issue or Comment
        if(this.issue != null && latestCommentUpdateID == -1)
        {
            this.format(this.issue.body)
        }
        else if(latestCommentUpdateID != -1)
        {
            this.format(this.comments[latestCommentUpdateID].body)
        }
        else
        {
            this.format('')
        }

    }
    format(sourceText) {
    // TODO: Input sanitzier
        if (sourceText != null) {
            // Title
            if (sourceText.search('### Issuetracker Description.\\[') != -1) {
                this.title = '<div><h2>' + sourceText.substring(
                    sourceText.search(new RegExp('### Issuetracker Description.\\[')) + 30,
                    sourceText.search(new RegExp('### Issuetracker Description.\\[')) + 30 + sourceText.substring(sourceText.search(new RegExp('### Issuetracker Description.\\[')) + 29, sourceText.length).search(new RegExp('\]')) - 1
                ) + '</h2></div>';
            }
            else
            {
                this.title =
                    '<div><h2>' + this.issue.title + '</h2></div>';
            }

            // Progressbar
            // TODO: It would be nice if progress data would be directly fetched from Project Board for higher code reusability
            switch(this.cardstatus)
            {
                case 'Backlog':
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 0"></span><span class="progressbartext">In Planung</span></div>';
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
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 100%"></span><span class="progressbartext">Fertig (' + this.cardstatusdate + ')</span></div>';
                        break;
                default:
                    this.progressbar = '<div class="progressbardiv"><span class="progressbarspan" style="width: 0"></span><span class="progressbartext">Status unbekannt</span></div>';
            }
            // Body
            this.mainbody = '<h3>Beschreibung</h3>';
            if (sourceText.search('### Issuetracker Description') != -1) {
                this.mainbody += formatDescription(
                    sourceText.substring(
                        sourceText.search('### Issuetracker Description') + sourceText.substring(sourceText.search('### Issuetracker Description')).search(new RegExp('[\n\r]')),
                        sourceText.length
                    )
                )
            } else {
                this.mainbody += '<p>Keine Spezielle Beschreibung gefunden. Folgende Beschreibung wurde aus dem zugeh&ouml;rigen GitHub-Issue generiert.<p><div style="border: 1px dashed gray;">' + formatDescription(sourceText) + '</div>';
            }

            // Links
            this.linksection = '<h3>Links</h3>'
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

function fetchIssues(url, authenticationToken, parser, formatter)
{
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const myArr = JSON.parse(this.responseText)
            parser(myArr, authenticationToken, formatter)
        }
        else if(this.readyState == 4)
        {
            handleRequestErrors(this)
        }
    }
    xmlhttp.open('GET', url, true)
    xmlhttp.setRequestHeader("Authorization", 'token ' + authenticationToken);
    xmlhttp.send()
}

function fetchCardStatus(feature, authenticationToken, callback)
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
                            Config.Projects.forEach(proj => {
                                if(myArr[i].project_card.project_id == proj)
                                {
                                    feature.setCardStatus(myArr[i].project_card.column_name, myArr[i].created_at);
                                }
                                else {
                                    // TODO: handle different Projects
                                }
                            })
                        }
                    }
                }
            }
            callback(true, feature)
        }
        else if(this.readyState == 4)
        {
            handleRequestErrors(this)
        }
    }
    xmlhttp.open('GET', url, true)
    xmlhttp.setRequestHeader("Authorization", 'token ' + authenticationToken);
    xmlhttp.setRequestHeader("Accept", "application/vnd.github.starfox-preview+json");
    xmlhttp.send()
}

function fetchComments(feature, authenticationToken, callback)
{
    url = 'https://api.github.com/repos/' + document.getElementById("targetrepo").value + '/issues/' + feature.issue.number + '/comments?per_page=100';
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const myArr = JSON.parse(this.responseText)
            feature.setComments(myArr)
            callback(true, feature)
        }
        else if(this.readyState == 4)
        {
            handleRequestErrors(this)
        }
    }
    xmlhttp.open('GET', url, true)
    xmlhttp.setRequestHeader("Authorization", 'token ' + authenticationToken);
    xmlhttp.setRequestHeader("Accept", "application/vnd.github.v3+json");
    xmlhttp.send()
}

function parseIssues(arr, authenticationToken, formatter) {
    const featurearray = []
    let i
    for (i = 0; i < arr.length; i++) {
        if (arr[i].pull_request == null) {
            featurearray.push(new Feature(arr[i]))
            // fetch card status and comments
            fetchCardStatus(featurearray[featurearray.length -1], authenticationToken, function(done, feature){
                if(done == true)
                {
                    fetchComments(feature, authenticationToken, function(done, feature){
                        if(done == true)
                        {
                            formatter(feature)
                        }
                    })
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
    // TODO: prevent this method from being loaded too often in a row. Maybe use fixed time intervals for reloading?

    let labels = ''
    Config.AllowedLabels.forEach(label => labels+=(label + '&'))
    const url = 'https://api.github.com/repos/' + document.getElementById("targetrepo").value + '/issues?labels=' + labels + 'per_page=30';
    const auth = document.getElementById("auth").value;

    // TODO: Fetch milestone info. Either just display them on the page, or determine if finished features are within a milestone and display that inside the relevant issue

    // clear output
    document.getElementById('maincontents').innerHTML = ''

    // Fetch all open issues to make sure that none are missed.
    fetchIssues(url + '&state=open', auth, parseIssues, formatFeature)
    // Fetch recently closed issues too
    fetchIssues(url + '&state=closed', auth, parseIssues, formatFeature)

    // update request limit after some time
    // TODO: remove me sometime closer to release
    setTimeout(() => {
        updateRequestLimit(auth)
    }, 2000);
}

function updateRequestLimit(auth)
{
    const xmlhttp = new XMLHttpRequest()
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const res = JSON.parse(this.responseText);
            document.getElementById("remainingRequests").innerText = 'Remaining API requests this hour: ' + res.rate.remaining + ' / ' + res.rate.limit;
        }
        else if(this.readyState == 4 && this.status == 403)
        {
            handleRequestErrors(this)
        }
    }
    xmlhttp.open('GET', 'https://api.github.com/rate_limit', true)
    if(auth != "")
    {
        xmlhttp.setRequestHeader("Authorization", 'token ' + auth);
    }
    xmlhttp.send()
}

function handleRequestErrors(err)
{
    console.log(err.status + ': ' + err.responseText)
    document.getElementById("errors").innerHTML = '<p style="color: red">A Problem occured fetching new data. See console for details.</p>';
}