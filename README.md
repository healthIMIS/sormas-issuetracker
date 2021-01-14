# GitHub Issuetracker

This issuetracker is supposed to automatically fetch issue data from the [SORMAS](https://github.com/hzi-braunschweig/SORMAS-Project) repository.
Issues can also be fetched from other repositories with the necessary configuration.

Issue Progress ratings are based on the issues position in project boards.

**PLEASE NOT THAT THIS PROJECT IS STILL WORK IN PROGRESS!**

## Usage

After setting up configuration, Issues will be fetched from the configured GitHub Project.
If an Issue or Issue Comment contains text starting with the `DescriptionIdentifier`, it will be automatically used to build a description for the issuetracker.

## Configuration

To configure the issuetracker, change the values of the JavaScript Objects `Config`, `ProjectColumns` and `i18n` in `DataFetcher.js`

#### General Config

* `Projects[]`: These Projects-IDs will be used to determine issue progress.
* `AllowedCommentAuthorIDs[]`: GitHub-user-ids who are allowed to change the feature description via comments.
* `AllowedCommentAuthorAssociations[]`: Array of GitHub Author Associations. Similar to AllowedCommentAuthorIDs, but seemingly **unreliable**. 
* `Label`: Issue label. Only Issues with this label will be considered by the issuetracker
* `DescriptionIdentifier`: Identifier which will be used to mark the beginning of a custom Issue Description
* `DescriptionEndTag`: Optional end-tag of custom descriptions.
* `displayDaysIfFinished`: How long finished features are to be displayed (days)
* `maxIssuesToFetch`: Maximum amount of issues to fetch. Reduce to save data. Increase for completeness. Maximum value 100
* `maxEventsToFetch`: Same as above. Recommended: 60
* `maxCommentsToFetch`: Same as above.

Please note that Events and Comments are fetched oldest-newest, so if there are more comments than maxCommentsToFetch, the newest comments **will not be fetched**.

#### ProjectColumns

Map All Project Columns to percentages and display Strings.

Structure: `'<Column Name as set in GitHub>': [<percentage>, '<display string>']'`

```
const ProjectColumns={
    'none' : [0, 'No Information'],
    'In Progress' : [50, 'Development'],
    'Done' : [100, 'Finished']
}
```

Please note that a Column named `'none'` needs to be definied, and that there needs to be exactly one column with percentage 100.

#### i18n
Placeholders to allow basic translation of the page.
Usage: `'<text>' : '<translation>'`

* `GitHubIssue`: GitHub Issue
* `NoDescriptionFound`: Text when no description was found
* `Description`: Description
* `Links`: Links

## Demo

You can try out the current version of the development-branch here: https://seal33.github.io/sormas-issuetracker/
