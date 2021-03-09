// For information on how to configure this Project, please read README
const Config={
    'Repository' : 'hzi-braunschweig/SORMAS-Project',
    'Projects' : [11280488, 11056239],
    'AllowedCommentAuthorIDs' : [4655486, 70317594, 76884029],
    'AuthenticationToken' : '57c1ed9995de7c04' + 'a63f2976a3caa68cfaff390c',
    'AllowedCommentAuthorAssociations' : ['OWNER', 'MEMBER'],
    'Label' : 'de-public',
    'DescriptionIdentifier' : '### Issuetracker-Description-DE',
    'DescriptionEndTag'  : '### End-Description-DE',
    'displayDaysIfFinished' : 21,
    'maxIssuesToFetch' : 30,
    'maxEventsToFetch' : 80,
    'maxCommentsToFetch' : 50
}
const ProgressState={
    'planned' : 'In Planung',
    'development' : 'In Entwicklung',
    'done' : 'Fertig',
}
const i18n={
    'GitHubIssue' : 'GitHub Issue',
    'NoDescriptionFound' : 'Keine Übersetzung gefunden. Originalbeschreibung:',
    'Description' : 'Beschreibung',
    'Links' : 'Links'
}

function formatDescription(desc) {
    // TODO: Catch unclosed html-comments
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
    desc = desc.replace(new RegExp('`[^`]*`', 'g'), function (x) {
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

    // last, remove leading and trailing linebreaks
    if(desc.substr(0, 4) == '<br>')
    {
        desc = desc.substr(4);
    }
    if(desc.substr(desc.length - 4, desc.length) == '<br>')
    {
        desc = desc.substr(0, desc.length - 4);
    }

    return desc
}

class Feature {
    title = ''
    progresstitle = ''
    progressstate = 'planned'
    mainbody = ''
    linksection = ''

    constructor(issue) {
        this.issue = issue
    }
    setComments(commentsArr){
        this.comments = commentsArr
    }
    isTooOld()
    {
        // Check if a finished issue was finished recently enough to still be displayed
        if(this.issue.state == 'closed')
        {
            const daysMS = (24*60*60*1000);
            const closedDate = new Date(this.issue.closed_at)
            if(new Date().getTime() - closedDate.getTime() > (Config.displayDaysIfFinished * daysMS))
            {
                return true;
            }
        }
        return false;
    }
    formatContents()
    {
        // Check comments for updated descriptions
        let latestCommentUpdateID = -1
        if(this.comments != null)
        {
            this.comments.forEach(function(comment, i) {
                if(comment.body.search(Config.DescriptionIdentifier) != -1)
                {
                    // check if comment creator has the necessary rights
                    Config.AllowedCommentAuthorIDs.forEach(authorID => {
                        if(comment.user.id == authorID) {
                            latestCommentUpdateID = i
                        }
                    })
                    // TODO: find out why author_association is sometimes wrong (API returns wrong value)
                    Config.AllowedCommentAuthorAssociations.forEach(association => {
                        if(comment.author_association == association) {
                            latestCommentUpdateID = i
                        }
                    })
                }
            })
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
        // TODO: Optimize for Mobile devices
        if (sourceText != null) {
            // Title
            //this.title='<span class="plus-icon"></span>';
            this.title='';
            if (sourceText.search(Config.DescriptionIdentifier + '.\\[') != -1) {
                this.title += '<div class="titlespan">' + sourceText.substring(
                    // TODO: the 30 and 29 here seem mighty suspicous
                    sourceText.search(new RegExp(Config.DescriptionIdentifier + '.\\[')) + 33,
                    sourceText.search(new RegExp(Config.DescriptionIdentifier + '.\\[')) + 33 + sourceText.substring(sourceText.search(new RegExp(Config.DescriptionIdentifier + '.\\[')) + 32, sourceText.length).search(new RegExp('\]')) - 1
                ) + '</div>';
            }
            else
            {
                this.title +=
                    '<div class="titlespan">' + this.issue.title + '</div>';
            }

            // Progress Information
            this.milestoneInfo = ''
            if(this.issue.state == 'closed') {
                this.progressstate = 'done'
                const milestonetitle = this.issue.milestone.title;
                // All milestonetitles should follow the convention: Sprint 123 - 1.2.3
                this.milestoneInfo = ' (' + milestonetitle.substring(milestonetitle.search(' - ') + 3) + ')';
            }
            this.progresstitle = '<div class="progresstext">' + ProgressState[this.progressstate] + this.milestoneInfo + '</div>';

            // Body
            this.mainbody = ''; //<h3>' + i18n.Description + '</h3>';
            if (sourceText.search(Config.DescriptionIdentifier) != -1) {
                const startIndex = sourceText.search(Config.DescriptionIdentifier) + sourceText.substring(sourceText.search(Config.DescriptionIdentifier)).search(new RegExp('[\n\r]'));
                var endIndex = sourceText.length;
                if(sourceText.search(Config.DescriptionEndTag) != -1)
                {
                    endIndex = sourceText.search(Config.DescriptionEndTag);
                }
                this.mainbody += formatDescription(
                    sourceText.substring(
                        startIndex,
                        endIndex
                    )
                )
            } else {
                this.mainbody += '<p>' + i18n.NoDescriptionFound + '<p><div style="border: 1px dashed gray;">' + formatDescription(sourceText) + '</div>';

            }

            // Links
            this.linksection = '' //<h4>' + i18n.Links + '</h4>'
            this.linksection += '<a href="' + this.issue.html_url + '" target="_blank">' + i18n.GitHubIssue + ' (#' + this.issue.number + ')</a><br>'
        }
    }
}

function styleCollapsibles()
{
    const collapsibles = document.getElementsByClassName('collapsiblebtn')
    let i

    for(i = 0; i < collapsibles.length; i++)
    {
        collapsibles[i].removeEventListener('click', collapsibleEventListener)
        collapsibles[i].addEventListener('click', collapsibleEventListener)
    }
}

function collapsibleEventListener()
{
    const content = this.nextElementSibling;
    if (content != null) {
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
            this.firstElementChild.classList.remove('minus-icon');
            this.firstElementChild.classList.add('plus-icon');
            content.style.borderTop = "0px solid #D23264";
        } else {
            content.style.borderTop = "1px solid #D23264";
            content.style.maxHeight = content.scrollHeight + "px";
            this.firstElementChild.classList.remove('plus-icon');
            this.firstElementChild.classList.add('minus-icon');
        }
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
    url = 'https://api.github.com/repos/' + Config.Repository + '/issues/' + feature.issue.number + '/events?per_page=' + Config.maxEventsToFetch;
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
                                    feature.progressstate = 'development';
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
    url = 'https://api.github.com/repos/' + Config.Repository + '/issues/' + feature.issue.number + '/comments?per_page=' + Config.maxCommentsToFetch;
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
    feature.html = '<div class="feature"><div class="collapsiblebtn"><div class="plusminus-icon plus-icon"></div>' + feature.title + feature.progresstitle +  '</div>'
    feature.html += '<div class="collapsiblecontent"><p>' + feature.mainbody + '</p><p>' + feature.linksection + '</p></div></div>'
    // make sure feature wasn't finished loong ago
    if(feature.isTooOld() == false) {
        document.getElementById('maincontents').innerHTML += feature.html
    }
    styleCollapsibles()
}

function fetchLatestRelease(url, authenticationToken)
{
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const myArr = JSON.parse(this.responseText)
            document.getElementById('currentVersion').textContent = 'Aktuelle Version: ' + myArr.name;
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

function fetchData()
{
    // TODO: Add some kind of loading indicator while issues are being fetched
    // TODO: Make sure that always the latest comments and events are fetched (if there are more entries than received due to per_page limit)
    const url = 'https://api.github.com/repos/' + Config.Repository + '/issues?labels=' + Config.Label + '&per_page=' + Config.maxIssuesToFetch;

    // clear output
    document.getElementById('maincontents').innerHTML = ''

    // get latest milestone
    fetchLatestRelease('https://api.github.com/repos/' + Config.Repository + '/releases/latest', Config.AuthenticationToken);
    // Fetch all open issues to make sure that none are missed.
    fetchIssues(url + '&state=open', Config.AuthenticationToken, parseIssues, formatFeature)
    // Fetch recently closed issues too
    fetchIssues(url + '&state=closed', Config.AuthenticationToken, parseIssues, formatFeature)
}

function handleRequestErrors(err)
{
    console.log(err.status + ': ' + err.responseText)
}
