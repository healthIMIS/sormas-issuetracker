# SORMAS Issuetracker

This issuetracker is supposed to automatically fetch issue data from the [SORMAS](https://github.com/hzi-braunschweig/SORMAS-Project) repository.
**Only issues and PRs with the _issuetracker_-label are taken into consideration!**

Issue Progress ratings are based on the following categories:
- Conceptual Design: Issue, but no PR created
- Development: Issue and PR created, but no review requested at the moment
- Quality Assurance: Issue and PR created, review requested
- Done: PR merged

If the Issue description contains a section starting with "### Issuetracker Description", everything following this section will be used to build the description.
Else, the entire Issue-Description is pulled.