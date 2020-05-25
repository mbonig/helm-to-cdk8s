



* run the default values file and produce a resulting templates, saved as 'default.snapshot.yaml' in the tests, also save off the values.yaml into the local directory

* write tests to do a full "equals" match
    * problem with this is that there are some helm-specific parts of the template that probably shouldn't come over
    * need to determine a way to do partial tests
* need to analyze existing helm chart:
    * determine values files to use
        * the default
        * an 'all-in'?
        * as many as needed to cover functionality
        * many different ifs could be represented

divide test files by resource type
* multiple tests for each `values` file defined previously

existing helm convention: release-name, that's the chart's name


---
Review the existing chart's README and templates
Divide and conquer approach:
Divide by resource type
Determine test for each resource type
determine number of snapshots you'll need
generate the snapshots
fill in the tests.
