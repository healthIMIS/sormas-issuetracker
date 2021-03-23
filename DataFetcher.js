// For information on how to configure this Project, please read README
const Config={
    'Repository' : 'hzi-braunschweig/SORMAS-Project',
    'Projects' : [11280488, 11056239],
    'AllowedCommentAuthorIDs' : [4655486, 70317594, 76884029],
    'AuthenticationToken' : '57c1ed9995de7c04' + 'a63f2976a3caa68cfaff390c',
    'AllowedCommentAuthorAssociations' : ['OWNER', 'MEMBER'],
    'Label' : 'de-public',
    'DescriptionIdentifier' : '###\\s*Issuetracker-Description-DE',
    'DescriptionEndTag'  : '###\\s*End-Description-DE',
    'displayDaysIfFinished' : 21,
    'maxIssuesToFetch' : 30,
    'maxEventsToFetch' : 80,
    'maxCommentsToFetch' : 50
}
const ProgressState={
    'planned' : 'In Planung',
    'development' : 'In Entwicklung',
    'done' : 'Verfügbar'
}
const i18n={
    'GitHubIssue' : 'GitHub Issue',
    'NoDescriptionFound' : 'Keine Übersetzung gefunden. Originalbeschreibung:',
    'Description' : 'Beschreibung',
    'Links' : 'Links'
}

// some very basic sanitization to prevent most common attacks
// TODO: Check sanitizer for further vulnerabilities
function sanitizeText(text)
{
    // Escape all tags, but first remove comments
    text = text.replace(new RegExp('<!--.*-->'), '');
    text = text.replace(new RegExp('&', 'g'), '&amp;');
    text = text.replace(new RegExp('<', 'g'), '&lt;');
    text = text.replace(new RegExp('>', 'g'), '&gt;');
    text = text.replace(new RegExp('"', 'g'), '&quot;');
    text = text.replace(new RegExp('\'', 'g'), '&#27;');
    return text;
}

function formatMarkdown(desc) {
    // Replace all headlines. Single # is ignored because it's comonly used to reference other issues
    desc = desc.replace(new RegExp('#####.*', 'g'), function (x) {
        return '<h5>' + x.substring(5, x.length) + '</h5>'
    })
    desc = desc.replace(new RegExp('####.*', 'g'), function (x) {
        return '<h4>' + x.substring(4, x.length) + '</h4>'
    })
    desc = desc.replace(new RegExp('###.*', 'g'), function (x) {
        return '<h3>' + x.substring(3, x.length) + '</h3>'
    })
    desc = desc.replace(new RegExp('##.*', 'g'), function (x) {
        return '<h2>' + x.substring(2, x.length) + '</h2>'
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
            '<a target="_blank" href="' + x.substring(x.search(']') + 2, x.length - 1) + '"><img class="featureimage" src ="' +
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

    // Replace Linebreaks, remove double linebreaks for better readability
    desc = desc.replace(new RegExp('\r?\n', 'g'), '<br>')
    //desc = desc.replace(new RegExp('<br><br>', 'g'), '<br>')
    desc = desc.replace(new RegExp('</h[2345]><br>', 'g'), function(x) {
        return x.substring(0, x.length-4);
    })

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

var latestVersion='1.57.2'

function compareVersions(v1, v2)
{
    var v1parts = v1.split('.')
    var v2parts = v2.split('.')

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }
    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
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
    getAge()
    {
        // return age since creation in milliseconds
        return(new Date().getTime() - new Date(this.issue.created_at).getTime());
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
        // TODO: Optimize for Mobile devices
        if (sourceText != null) {
            sourceText = sanitizeText(sourceText)
            // Title
            this.title='';
            if (sourceText.search(Config.DescriptionIdentifier + '\\s*\\[') != -1) {
                const regex = RegExp(Config.DescriptionIdentifier);
                // find beginning of description identifier
                const descStartIndex = regex.exec(sourceText).index;
                // find beginning and end of title
                const titleStartIndex = descStartIndex + sourceText.substring(descStartIndex).search(new RegExp('\\[')) + 1;
                const titleEndIndex = descStartIndex + sourceText.substring(descStartIndex).search(new RegExp('\\]'));
                this.title += '<span class="titlespan">' + sourceText.substring(titleStartIndex, titleEndIndex) + '</span>';
            }
            else
            {
                this.title +=
                    '<span class="titlespan">' + this.issue.title + '</span>';
            }

            // Progress Information
            this.milestoneInfo = ''
            if(this.issue.state == 'closed') {
                // All milestonetitles should follow the convention: Sprint 123 - 1.2.3
                const milestonetitle = this.issue.milestone.title;
                const milestoneVersion = milestonetitle.substring(milestonetitle.search(' - ') + 3)

                // check weather if the milestone is older or newer than the newest version

                if(compareVersions(milestoneVersion, latestVersion) == 1)
                {
                    this.milestoneInfo = ' ab Version ' + milestoneVersion;
                }
                else
                {
                    this.milestoneInfo = ' seit Version ' + milestoneVersion;
                }
                // TODO: what if no milestone is available?

                this.progressstate = 'done'
            }
            this.progresstitle = '<span class="progresstext">' + ProgressState[this.progressstate] + this.milestoneInfo + '</span>';

            // Body
            this.mainbody = ''; //<h3>' + i18n.Description + '</h3>';
            if (sourceText.search(Config.DescriptionIdentifier) != -1) {
                const startIndex = sourceText.search(Config.DescriptionIdentifier) + sourceText.substring(sourceText.search(Config.DescriptionIdentifier)).search(new RegExp('[\n\r]'));
                var endIndex = sourceText.length;
                if(sourceText.search(Config.DescriptionEndTag) != -1)
                {
                    endIndex = sourceText.search(Config.DescriptionEndTag);
                }
                this.mainbody += formatMarkdown(
                    sourceText.substring(
                        startIndex,
                        endIndex
                    )
                )
            } else {
                this.mainbody += '<p style="margin: 0; padding-top: 2px; padding-bottom: 5px;">' + i18n.NoDescriptionFound + '</p><div style="border: 1px dashed gray;">' + formatMarkdown(sourceText) + '</div>';

            }

            // Links
            this.linksection = '' //<h4>' + i18n.Links + '</h4>'
            this.linksection += '<a href="' + this.issue.html_url + '" target="_blank">' + i18n.GitHubIssue + ' (#' + this.issue.number + ')</a><br>'
        }
    }
}


var features = [];
var numIssuesToFetch = 0;
var numFullyReceivedIssues = 0;

function fetchIssues(url, authenticationToken, parser, formatter)
{
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const myArr = JSON.parse(this.responseText)
            numIssuesToFetch += myArr.length;
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

function parseIssues(arr, authenticationToken) {
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
                            // Once I am here, all required information for the issue is fetched
                            feature.formatContents()
                            features.push(feature)
                            numFullyReceivedIssues += 1;
                            if(numFullyReceivedIssues == numIssuesToFetch)
                            {
                                pushFeaturesToHtml();
                            }
                        }
                    })
                }
            });
        }
    }
}

function pushFeaturesToHtml()
{
    // sort features by age and progressstate
    features.sort(function (a,b) {
        if(a.progressstate == b.progressstate) {
            if (a.getAge() < b.getAge()) {
                return -1;
            }
            if (a.getAge() > b.getAge()) {
                return 1;
            }
            return 0;
        }})
    features.sort(function (a,b) {
        var aStateInteger;
        var bStateInteger;
        if(a.progressstate == 'planned')
        {
            aStateInteger = 0;
        }
        else if(a.progressstate == 'development')
        {
            aStateInteger = 1;
        }
        else if(a.progressstate == 'done')
        {
            aStateInteger = 2;
        }
        if(b.progressstate == 'planned')
        {
            bStateInteger = 0;
        }
        else if(b.progressstate == 'development')
        {
            bStateInteger = 1;
        }
        else if(b.progressstate == 'done')
        {
            bStateInteger = 2;
        }

        if(aStateInteger > bStateInteger)
        {
            return -1;
        }
        else if (aStateInteger < bStateInteger)
        {
            return 1;
        }
        else
        {
            if(a.progressstate == 'done' && b.progressstate == 'done')
            {
                // if both issues are finished sort by closed date
                const aClosedDate = new Date().getTime() - new Date(a.issue.closed_at).getTime();
                const bClosedDate = new Date().getTime() - new Date(b.issue.closed_at).getTime();
                if(aClosedDate < bClosedDate)
                {
                    return 1;
                }
                return -1;
            }
            return 0;
        }

        return 0;
    });

    // format feature divs
    features.forEach(elem => {
        elem.html = '<div class="feature"><div class="collapsiblebtn"><span class="plusminus-icon plus-icon"></span>' + elem.title + elem.progresstitle +  '</div>'
        elem.html += '<div class="collapsiblecontent"><div class="featurecontent">' + elem.mainbody + '</div><div class="featurelinks">' + elem.linksection + '</div></div></div>'

        // make sure feature wasn't finished too long ago
        if(elem.isTooOld() == false) {
            document.getElementById('maincontents').innerHTML += elem.html
        }

    });

    // Everything received!
    document.getElementById('maincontents').style.display = "block"
    document.getElementById('loadingicon').style.display = "none"
    addCollapsibleEventListener()
}

function addCollapsibleEventListener()
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

function fetchLatestRelease(url, authenticationToken)
{
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const myArr = JSON.parse(this.responseText)
            latestVersion = myArr.name.substring(7); // Releases usually start with SORMAS X.XX.X
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
    // TODO: Make sure that always the latest comments and events are fetched (if there are more entries than received due to per_page limit)
    const url = 'https://api.github.com/repos/' + Config.Repository + '/issues?labels=' + Config.Label + '&per_page=' + Config.maxIssuesToFetch;

    // clear output, display loadingbar
    document.getElementById('maincontents').innerHTML = ''
    document.getElementById('maincontents').style.display = "none"
    document.getElementById('loadingicon').style.display = "block"
    numFullyReceivedIssues = 0;
    numIssuesToFetch = 0;

    // get latest milestone
    fetchLatestRelease('https://api.github.com/repos/' + Config.Repository + '/releases/latest', Config.AuthenticationToken);
    // Fetch all open issues to make sure that none are missed.
    fetchIssues(url + '&state=open', Config.AuthenticationToken, parseIssues)
    // Fetch recently closed issues too
    fetchIssues(url + '&state=closed', Config.AuthenticationToken, parseIssues)
}

function handleRequestErrors(err)
{
    console.log(this)
    console.log(err.status + ': ' + err.responseText)
}
