### LinkVault
A web application to share the data like text or file via a link. The safety lies here, the link is unpredictable to guess.
This is used to share content temporarily between the people.

This possess some cool features: 
Password: To open the link the user has to give password to access the content.
Expiry: User can set the expiry date and time to expire the content in the link.
Limits: User can restrict the number of views for text and number of downlaods for file.
One time view: Using this feature only one time the content can be accessible after the link generation.
File size and types: Only .png, .jpg, .jpeg, .docx, .pdf are allowed and maximum size of 15MB.

## Tech stack
# Frontend:
React (vite)
Tailwind CSS
Axios

# Backend:
Node.js
Express.js
MongoDB + Mangoose
Multer
UUID

## Setup
# To run Backed:
Open the terminal go to the Project folder:
    cd express-app
    npm install express mongoose multer bcrypt uuid dotenv cors nodemon
    node index.js

# To run Frontend:
Opend the terminal go to the Project folder:
    cd application
    npm install axios react-datepicker
    npm install -D tailwindcss postcss autoprefixer
    npm run dev

## API Overview
Base_url = http://localhost:5000

# To upload content
POST /content/upload
# To get content
GET /content/:id
# To download content
GET /content/download/:id
# To verify password
POST /content/verify/:id

# Error Code
403 is used to handle links that are invalid, expiry and limit exceeded.

## Design decisions:
Limited size is 15MB for file input.
Allowed file types are .pdf, .png, .jpg, .jpeg, .docx
Default expiry time is 10 minutes.
Only one of Max views/downloads or one time view feature can be selected.
Password, Limits, Expiry are completely optional.

# Limitations
This project uses local storage instead of any cloud for database.
