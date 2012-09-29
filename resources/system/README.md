# system

interacts with the operating system

## API

#### [properties](#system-properties)

  - [id](#system-properties-id)


#### [methods](#system-methods)

  - [info](#system-methods-info) ()

  - [useradd](#system-methods-useradd) (options, callback)

  - [userdel](#system-methods-userdel) (options, callback)

  - [passwd](#system-methods-passwd) (options, callback)

  - [groupadd](#system-methods-groupadd) (options, callback)

  - [members](#system-methods-members) (options, callback)


interacts with the operating system

- **id** 

  - **type** : any


<a name="system-methods"></a> 

## methods 

<a name="system-methods-info"></a> 

### system.info()

<a name="system-methods-useradd"></a> 

### system.useradd(options, callback)

adds a user to a group

- **options** 

  - **type** : object

  - **properties**

    - **user** 

      - **description** : the name of the user to add

      - **type** : string

      - **required** : true

    - **password** 

      - **description** : the password of the user to be added

      - **type** : string

      - **required** : true

    - **group** 

      - **description** : group to add user to

      - **type** : string

      - **default** : big-users

- **callback** 

  - **type** : function

<a name="system-methods-userdel"></a> 

### system.userdel(options, callback)

removes a user from a group

- **options** 

  - **type** : object

  - **properties**

    - **user** 

      - **description** : the name of the user to add

      - **type** : string

      - **required** : true

    - **group** 

      - **description** : user group to add user to

      - **type** : string

      - **default** : big-users

- **callback** 

  - **type** : function

<a name="system-methods-passwd"></a> 

### system.passwd(options, callback)

changes a user's password

- **options** 

  - **type** : object

  - **properties**

    - **user** 

      - **description** : the name of the user to update password for

      - **type** : string

      - **required** : true

    - **password** 

      - **description** : the new password

      - **type** : string

      - **required** : true

- **callback** 

  - **type** : function

<a name="system-methods-groupadd"></a> 

### system.groupadd(options, callback)

adds a new group to the system

- **options** 

  - **type** : object

  - **properties**

    - **name** 

      - **description** : the name of the group

      - **type** : string

      - **required** : true

- **callback** 

  - **type** : function

<a name="system-methods-members"></a> 

### system.members(options, callback)

lists members of a group

- **options** 

  - **type** : object

  - **properties**

    - **name** 

      - **description** : the name of the group

      - **type** : string

      - **default** : big-users

      - **required** : true

- **callback** 

  - **type** : function


*README auto-generated with [big-docs](https://github.com/bigcompany/big/tree/master/resources/docs)*