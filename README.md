Fireblog
========
Fireblog is a serverless blogging platform designed to run on [Google Firebase](https://firebase.google.com/).  Google Firebase provides an excellent [realtime database](https://firebase.google.com/docs/database/) that allows for simple and easy extraction of data via a simple REST interface.  A major goal of Fireblog is to make it very simple to migrate existing blogs.

Fireblog renders blog post content by extracting data from the realtime database, and rendering it into a template.  It is a modern approach to blogging, which should simplify the design and improve server performance. 

Some microservices will be developed, using [Google Cloud Functions](https://cloud.google.com/functions/).

----------

Development Plan
----------------

#### Import Functionality
The plan is to be able to import a [WordPress](http://wordpress.org) blog to Fireblog, so we will be starting with import functionality to load blog posts into the Firebase Realtime Database.  To keep microservices to a minimum, the blog file import and parsing will take place within the browser.

Once the blog posts are imported and parsed by the browser, the posts can be uploaded using a microservice that imports them one at a time.  The browser will make simultaneous requests to the post microservice, running several in parallel at once to speed up the overall import.

The microservice will be fairly advanced, and will analyze the posts for hosted images and files.  One major difficulty that Fireblog will overcome is importing hosted images and files along with the blog posts themselves.  The files and images will be embedded directly in-line within the posts using [data URIs](https://en.wikipedia.org/wiki/Data_URI_scheme).  In order to do this, the microservice will parse HTML in the blog post to identify and download any hosted images and files, generate the data URIs, and embed them into the post.

#### Post Display Functionality
Priority #2 will be extracting posts from the realtime database to render them as blog post pages.

#### Blog Management Functionality
Of course, a user would need to be able to manage the blog.  The first priority for blog management will be blog post creation and edit.  If things go well, we may get more ambitious and try to build an interface for managing the blog template rather than having to edit source files.