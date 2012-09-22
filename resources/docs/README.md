# docs


# usage

    var big = require("big");
    big.use("docs");

## docs

#### [properties](#docs-properties)

  - [id](#docs-properties-id)


#### [methods](#docs-methods)

  - [generate](#docs-methods-generate) (resource, template)

  - [build](#docs-methods-build) ()

  - [view](#docs-methods-view) (resource)




- **id** 

  - **type** : any


<a name="docs-methods"></a> 

## methods 

<a name="docs-methods-generate"></a> 

### docs.generate(resource, template)

generates markdown documentation from a resource

- **resource** 

  - **description** : the resource to generate documentation for

- **template** 

  - **type** : string

  - **required** : true

<a name="docs-methods-build"></a> 

### docs.build()

<a name="docs-methods-view"></a> 

### docs.view(resource)

views the Markdown documentation for any resource

- **resource** 

  - **description** : the resource to view documentation for

  - **type** : function

  - **required** : true


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*