# Apex Helper - Formatter README
The goal of this application is to provide a few features for salesforce developers.
This extention is still in development please contribute. [Github Repo](https://github.com/Vishal-skywalker/apex-helper), Happy coding...

## Features
### Current 
- Format document 
    - To trigger use the default format document command
- Automatic comment addeder
    - For Class
        - Select the whole class and `ctrl + shift + p` then execute `Add Comments (Apex Helper)` command OR Right Click and select `Add Comments (Apex Helper)`
        - This will add a comment like this at the top of the class
        ```java
        /**
         * @description add your description here
         */
        ```
    - For method
        - Select the whole method and `ctrl + shift + p` then execute `Add Comments (Apex Helper)` command OR Right Click and select `Add Comments (Apex Helper)`
        - This will add a comment like this at the top of the method
        ```java
        /**
         * @description add your description here
         * @param Date birthDate
         * @param String subsidiary
         * @return String Returns null if age is valid
         */
        ```

### Future
- Range formatter 