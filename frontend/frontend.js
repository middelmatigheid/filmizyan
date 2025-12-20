import http from "http";
import url from 'url';
import path from "path";
import nunjucks from "nunjucks";
import Busboy from "busboy";
import fs from "fs/promises";
import fsSync from "fs";
import winston from "winston";


// Server port and api url configuration
const PORT = 8000;
// const API_URL = "http://backend:5000/"
const API_URL = "http://localhost:5000/"
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Nunjucks configuration
nunjucks.configure(path.join(__dirname, "templates"), {
    autoescape: true,
    noCache: true,
    watch: true 
});


// Logging configuration
const logging = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
    winston.format.printf(({ timestamp, level, message, file }) => {
      const filename = file ? path.basename(file) : "frontend.js";
      return `${timestamp} - ${level.toUpperCase()} - ${filename} - ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ 
        // filename: "/logs/logging.log"
        filename: "../logs/logging.log", 
        options: { 
            flags: "a"
        },
        encoding: "utf8",
        level: "error"
    })
  ]
});


// Function makeApiRequest takes url endpoint and JSON options as arguments
// and makes request to the FastAPI backend
async function makeApiRequest(endpoint, options = {}) {
    try {
        // Creating url of a request to the backend
        const url = new URL(endpoint, API_URL);

        // Making a request
        const response = await fetch(url, {
            method: options.method || "GET",  // Request method
            headers: {
                "Content-Type": "application/json",  // Data format
                ...options.headers  // User headers
            },                    
            body: options.body ? JSON.stringify(options.body) : undefined  // Request body
        });
        return await response.json();
    
    // An error has occurred
    } catch (error) {
        logging.error(`An error occurred while serving ${new URL(endpoint, API_URL)}:\n${error}`);
        return {status_code: 500};
    }
}


// Function serveStaticFile serves GET requests from client to static files
async function serveStaticFile(req, res) {
    // Defining MIME-types
    const mimeTypes = {
        ".css": "text/css",
        ".js": "text/javascript",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".json": "application/json"
    };

    try {
        // Checking if the request to a static file
        if (req.url.startsWith('/static/')) {
            const filePath = path.join(__dirname, req.url);
            
            // Checking if the file exists
            try {
                await fs.access(filePath);
            } catch {
                logging.error(`An error occurred while serving ${req.url}:\nNo such file as ${filePath}`);
                res.writeHead(404);
                res.end("File not found");
                return true;
            }

            if (!filePath.startsWith(path.join(__dirname, "static"))) {
                logging.error(`Forbidden: ${req.url}: ${filePath}`);
                res.writeHead(403);
                res.end("Forbidden");
                return true;
            }
            
            // Defining response MIME-type
            const ext = path.extname(filePath);
            const contentType = mimeTypes[ext] || "text/plain";
            
            // Reading the file
            const data = await fs.readFile(filePath);
            res.writeHead(200, {"Content-Type": contentType});
            res.end(data);
            return true;
        }
        return false;

    // An error has occurred 
    } catch (error) {
        logging.error(`An error occurred while serving ${req.url}:\n${error}`);
        res.writeHead(500);
        res.end("Server error");
        return true;
    }
}


// Function renderTemplate takes templateName as an argument and renders nunjucks template
function renderTemplate(templateName, data = {}) {
    return new Promise((resolve, reject) => {
        nunjucks.render(templateName, data, (error, html) => {
            // An error has occurred
            if (error) {
                logging.error(`An error occurred while rendering ${templateName}:\n${error}`);
                reject(error);
            // Template rendered successfully
            } else {
                resolve(html);
            }
        });
    });
}


// Function refreshPage takes html as an argument and creates javascript to refresh the client page
function refreshPage(html) {
    return `<script>
                // Adding new html to the client
                document.body.insertAdjacentHTML("beforeend", \`${html}\`);

                // Refreshing the scripts
                const scripts = document.body.querySelectorAll("script[src]");
                const promises = [];
                for (let i = 0; i < scripts.length; i++) {
                    const newScript = document.createElement("script");
                    newScript.src = scripts[i].src;

                    promises.push(new Promise(resolve => {
                        newScript.onload = resolve;
                        newScript.onerror = resolve;
                    }));

                    scripts[i].remove();
                    document.body.appendChild(newScript);
                }

                // Starting up the js
                Promise.all(promises)
                .then(() => {
                    return start();
                })
                .then(() => {
                    return addSearcher();
                })
                .then(() => {
                    setTimeout(() => {
                        document.querySelector(".loading").remove();
                        document.querySelector(".container").style.display = "block";
                    }, 100);
                })
            </script>`
}


// Function parseCookie takes headers cookie and return parsed dictionary
async function parseCookie(cookieHeader) {
    if (!cookieHeader) return {};
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
    });
    return cookies;
}


// Serving home page
async function homePage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Sending loading page
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(await renderTemplate("loading.njk", data));

        data.has_login = true;
        // Getting user info
        let cookie = await parseCookie(req.headers.cookie);
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            if (result.status_code === 200 && result.type === "access") {
                data.user = result.user;
            }
        }
        // Sending home page
        res.end(refreshPage(await renderTemplate("index.njk", data)));

    // Serving POST request
    } else {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end("Method isn't allowed");
    }
}


// Serving search page
async function searchPage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Sending loading page
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(await renderTemplate("loading.njk", data));

        // Getting data from the backend
        data = await makeApiRequest(req.url);
        data.has_searcher = true;
        data.has_login = true;
        data.has_footer = true;
        // Getting user info
        let cookie = await parseCookie(req.headers.cookie);
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            if (result.status_code === 200 && result.type === "access") {
                data.user = result.user;
            }
        }
        // Sending search page
        res.end(refreshPage(await renderTemplate("search.njk", data)));
        
    // Serving POST request
    } else {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end("Method isn't allowed");
    }
}


// Serving film page
async function filmPage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Sending loading page
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(await renderTemplate("loading.njk", data));

        // Getting data from the backend
        data = await makeApiRequest(req.url);
        data.has_searcher = true;
        data.has_login = true;
        data.has_footer = true;
        data.user_likes = [];
        // Getting user info
        let cookie = await parseCookie(req.headers.cookie);
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            if (result.status_code === 200 && result.type === "access") {
                data.user = result.user;
                // Film was found
                if (data.film) {
                    result = await makeApiRequest(`/check-watch-later?user_id=${data.user.id}&kinopoisk_id=${data.film.kinopoisk_id}`);
                    data.film.watch_later = result.res;

                    result = await makeApiRequest(`/get-user-film-review/?user_id=${data.user.id}&kinopoisk_id=${data.film.kinopoisk_id}`);
                    data.user_review = result.user_review;

                    result = await makeApiRequest(`/get-user-review-likes/?user_id=${data.user.id}`);
                    data.user_likes = result.user_likes;
                }
            }
        }
        // Sending film page
        res.end(refreshPage(await renderTemplate("film.njk", data)));
        
    // Serving POST request
    } else {
        // Getting body of a POST form
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        // Body of the POST form was read
        req.on("end", async () => {
            try {
                // Transfoming POST form body to a JSON
                let form = JSON.parse(body);

                // Adding the film to user watch later list
                if (form.type === "add-watch-later") {
                    // Getting user info
                    let cookie = await parseCookie(req.headers.cookie);
                    if ("access_token" in cookie) {
                        let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
                        // User is authorized
                        if (result.status_code === 200 && result.type === "access") {
                            result = await makeApiRequest("/add-watch-later", {
                                method: "POST", 
                                body: {user_id: result.user.id, kinopoisk_id: Number(req.url.split("film/")[1].replace(/\/?$/, ''))}
                            });
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(result));
                        // Unknown user
                        } else {
                            res.writeHead(401, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({"status_code": 401}));
                        }
                    // Unknown user
                    } else {
                        res.writeHead(401, {"Content-Type": "application/json"});
                        res.end(JSON.stringify({"status_code": 401}));
                    }

                // Deleting the film from user watch later list
                } else if (form.type === "delete-watch-later") {
                    // Getting user info
                    let cookie = await parseCookie(req.headers.cookie);
                    if ("access_token" in cookie) {
                        let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
                        // User is authorized
                        if (result.status_code === 200 && result.type === "access") {
                            result = await makeApiRequest("/delete-watch-later", {
                                method: "DELETE",
                                body: {user_id: result.user.id, kinopoisk_id: Number(req.url.split("film/")[1].replace(/\/?$/, ''))}
                            });
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(result));
                            // Unknown user
                        } else {
                            res.writeHead(401, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({"status_code": 401}));
                        }
                    // Unknown user
                    } else {
                        res.writeHead(401, {"Content-Type": "application/json"});
                        res.end(JSON.stringify({"status_code": 401}));
                    }

                // Adding a new review to the film
                } else if (form.type === "add-review") {
                    // Getting user info
                    let cookie = await parseCookie(req.headers.cookie);
                    if ("access_token" in cookie) {
                        let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
                        if (result.status_code === 200 && result.type === "access") {
                            // Adding info to the form
                            form.rating = Number(form.rating);
                            form.user_id = Number(result.user.id);
                            form.kinopoisk_id = Number(req.url.split("film/")[1].replace(/\/?$/, ''));
                            // Making request to the backend
                            result = await makeApiRequest('/add-review', {
                                method: "POST",
                                body: form
                            });
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(result));
                        // Unknown user
                        } else {
                            res.writeHead(401, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({status_code: 401}));
                        }
                    // Unknown user
                    } else {
                        res.writeHead(401, {"Content-Type": "application/json"});
                        res.end(JSON.stringify({status_code: 401}));
                    }

                // Deleting user review
                } else if (form.type === "delete-review") {
                    // Getting user info
                    let cookie = await parseCookie(req.headers.cookie);
                    if ("access_token" in cookie) {
                        let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
                        if (result.status_code === 200 && result.type === "access") {
                            // Adding info to the form
                            form.user_id = Number(result.user.id);
                            form.kinopoisk_id = Number(req.url.split("film/")[1].replace(/\/?$/, ''));
                            // Making request to the backend
                            result = await makeApiRequest('/delete-review', {
                                method: "DELETE",
                                body: {user_id: Number(result.user.id), kinopoisk_id: Number(req.url.split("film/")[1].replace(/\/?$/, ''))}
                            });
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(result));
                        // Unknown user
                        } else {
                            res.writeHead(401, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({status_code: 401}));
                        }
                    // Unknown user
                    } else {
                        res.writeHead(401, {"Content-Type": "application/json"});
                        res.end(JSON.stringify({status_code: 401}));
                    }

                // Adding like to a review
                } else if (form.type === "add-review-like") {
                    // Getting user info
                    let cookie = await parseCookie(req.headers.cookie);
                    if ("access_token" in cookie) {
                        let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
                        if (result.status_code === 200 && result.type === "access") {
                            // Adding info to the form
                            form.user_id = Number(result.user.id);
                            form.review_id = Number(form.review_id);
                            // Making request to the backend
                            result = await makeApiRequest('/add-review-like', {
                                method: "POST",
                                body: form
                            });
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(result));
                        } else {
                            res.writeHead(401, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({status_code: 401}));
                        }
                    } else {
                        res.writeHead(401, {"Content-Type": "application/json"});
                        res.end(JSON.stringify({status_code: 401}));
                    }

                // Deleting like from a review
                } else if (form.type === "delete-review-like") {
                    // Getting user info
                    let cookie = await parseCookie(req.headers.cookie);
                    if ("access_token" in cookie) {
                        let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
                        if (result.status_code === 200 && result.type === "access") {
                            // Adding info to the form
                            form.user_id = Number(result.user.id);
                            form.kinopoisk_id = Number(req.url.split("film/")[1].replace(/\/?$/, ''));
                            // Making request to the backend
                            result = await makeApiRequest('/delete-review-like', {
                                method: "DELETE",
                                body: form
                            });
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(result));
                        // Unknown user
                        } else {
                            res.writeHead(403, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({status_code: 403}));
                        }
                    // Unknown user
                    } else {
                        res.writeHead(403, {"Content-Type": "application/json"});
                        res.end(JSON.stringify({status_code: 403}));
                    }
                }

            // An error has occurred
            } catch(error) {
                logging.error(`An error occurred while serving POST request at ${req.url}:\n${error}`);
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({status_code: 500, message: "Произошла непредвиденная ошибка"}));
            }
        });
    }
}


// Serving login page
async function loginPage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Getting user info
        let cookie = await parseCookie(req.headers.cookie);
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            if (result.status_code === 200 && result.type === "access") {
                res.writeHead(302, {'Location': `/profile/${result.user.login}`});
                res.end();
                return;
            }
        }

        // Sending loading page
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(await renderTemplate("loading.njk", data));

        // Reading url query params
        const url = new URL(req.url, `http://${req.headers.host}`);
        // Expired token
        if (url.searchParams && url.searchParams.get('failed') === "token-has-expired") {
            data.failed = "Истек срок действия ссылки";
        // Invalid token
        } else if (url.searchParams && url.searchParams.get('failed') === "invalid-token") {
            data.failed = "Неизвестная ссылка";
        }
        
        // Sending login page
        res.end(refreshPage(await renderTemplate("login.njk", data)));
        
    // Serving POST request
    } else {
        // Getting body of a POST form
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        // Body of the POST form was read
        req.on("end", async () => {
            try {
                // Transfoming POST form body to a JSON
                let form = JSON.parse(body);

                // Generating password
                if (form.type === "generate-password") {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify(await makeApiRequest('/generate-password')));

                // Processing POST request
                } else {
                    // Making request to the backend
                    let result = await makeApiRequest(req.url, {
                        method: "POST",
                        body: form
                    });
                    // Adding JWT to user cookie
                    if (result.status_code === 200 && "access_token" in result) {
                        res.setHeader("Set-Cookie", [`access_token=${result.access_token}; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax`]);
                    }
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify(result));
                }

            // An error has occurred
            } catch(error) {
                logging.error(`An error occurred while serving POST request at ${req.url}:\n${error}`);
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({status_code: 500, message: "Произошла непредвиденная ошибка"}));
            }
        });
    }
}


// Serving recovery page
async function recoveryPage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Getting user info
        let cookie = await parseCookie(req.headers.cookie);
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            if (result.status_code === 200 && result.type === "access") {
                res.writeHead(302, {'Location': `/profile/${result.user.login}`});
                res.end();
                return;
            } else if (result.status_code === 200 && result.type === "recovery") {
                data.user_login = result.user.login;
            }
        }
        // Sending loading page
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(await renderTemplate("loading.njk", data));

        // Reading url query params
        const url = new URL(req.url, `http://${req.headers.host}`);
        // Expired token
        if (url.searchParams && url.searchParams.get('failed') === "token-has-expired") {
            data.failed = "Истек срок действия ссылки";
        // Invalid token
        } else if (url.searchParams && url.searchParams.get('failed') === "invalid-token") {
            data.failed = "Неизвестная ссылка";
        }
        
        // Sending recovery page
        res.end(refreshPage(await renderTemplate("recovery.njk", data)));
        
    // Serving POST request
    } else {
        // Getting body of a POST form
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        // Body of the POST form was read
        req.on("end", async () => {
            try {
                // Transfoming POST form body to a JSON
                let form = JSON.parse(body);

                // Generating password
                if (form.type === "generate-password") {
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify(await makeApiRequest('/generate-password')));
                
                // Processing POST request
                } else {
                    // Adding info to the form
                    let cookie = await parseCookie(req.headers.cookie);
                    if ("access_token" in cookie) form.access_token = cookie.access_token;
                    // Making request to the backend
                    let result = await makeApiRequest(req.url, {
                        method: "POST",
                        body: form
                    });
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify(result));
                }

            // An error has occurred
            } catch(error) {
                logging.error(`An error occurred while serving POST request at ${req.url}:\n${error}`);
                res.writeHead(500, {"Content-Type": "application/json"});
                res.end(JSON.stringify({status_code: 500, message: "Произошла непредвиденная ошибка"}));
            }
        });
    }
}


// Serving recovery token
async function recoveryToken(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Making request to the backend
        let result = await makeApiRequest(req.url);

        // Authorized token
        if (result.status_code === 200) {
            res.setHeader("Set-Cookie", [`access_token=${result.access_token}; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax`]);
            res.writeHead(302, {"Location": "/recovery"});
            res.end();

        // An issue occurred
        } else if ("message" in result) {
            res.writeHead(302, {"Location": `/recovery?failed=${result.message}`});
            res.end();

        // Unknown issue
        } else {
            res.writeHead(302, {"Location": "/login"});
            res.end();
        }

    // Serving POST request
    } else {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end("Method isn't allowed");
    }
}


// Serving verification token
async function verifyToken(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Making request to the backend
        let result = await makeApiRequest(req.url);

        // Authorized token
        if (result.status_code === 200 && "access_token" in result) {
            res.setHeader("Set-Cookie", [`access_token=${result.access_token}; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax`]);   
            res.writeHead(302, {"Location": "/login"});
            res.end();

        // An issue occurerd
        } else if ("message" in result) {
            res.writeHead(302, {"Location": `/login?failed=${result.message}`});
            res.end();

        // Unknown issue
        } else {
            res.writeHead(302, {"Location": "/login"});
            res.end();
        }

    // Serving POST request
    } else {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end("Method isn't allowed");
    }
}


// Serving profile page
async function profilePage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Sending loading page
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(await renderTemplate("loading.njk", data));

        // Getting profile info
        let user = await makeApiRequest(req.url)
        if (user.status_code === 200) {
            data.profile = user.user;

            // Getting profile watch later list
            let result = await makeApiRequest(`/get-user-watch-later/?user_id=${data.profile.id}`);
            data.profile.watch_later = result.watch_later;

            // Getting profile reviews
            result = await makeApiRequest(`/get-user-reviews/?user_id=${data.profile.id}`);
            data.profile.reviews = result.reviews;
            data.profile.without_reviews = result.without_reviews;

            // Getting user_likes
            result = await makeApiRequest(`/get-user-review-likes/?user_id=${data.profile.id}`);
            data.user_likes = result.user_likes;
        }

        // Getting user info
        let cookie = await parseCookie(req.headers.cookie)
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            // It is user profile
            if (result.status_code === 200 && data.profile && result.user.login === data.profile.login && result.type === "access") {
                data.edit_user = true;
                data.has_logout = true;
            // It is not user profile
            } else if (result.status_code === 200) {
                data.user = result.user;
                data.has_login = true;
            }
        }

        // Sending profile page
        res.end(refreshPage(await renderTemplate("profile.njk", data)));
        
    // Serving POST request
    } else {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end("Method isn't allowed");
    }
}


// Serving edit profile page
async function editProfilePage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Sending loading page
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(await renderTemplate("loading.njk", data));

        // Getting profile info
        let user = await makeApiRequest(req.url.replace("/edit", ""));
        if (user.status_code === 200) {
            data.user = user.user;
        }

        // Getting user info
        let cookie = await parseCookie(req.headers.cookie)
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            // Authorized user
            if (result.status_code === 200 && result.user.login === data.user.login && result.type === "access") {
                data.has_login = true;
                res.end(refreshPage(await renderTemplate("edit_profile.njk", data)));
            // Unknown user
            } else {
                res.write(`<script>window.location.replace(window.location.href.replace("/edit", ""));</script>`);
                res.end();
            }
        // Unknown user
        } else {
            res.write(`<script>window.location.replace(window.location.href.replace("/edit", ""));</script>`);
            res.end();
        }

    // Serving POST request
    } else {
        // POST form fields
        const fields = {"login": req.url.replace("/edit", "").split("/profile/")[1]};

        // Getting user info
        let cookie = await parseCookie(req.headers.cookie);
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            // Authorized user
            if (result.status_code === 200 && result.type === "access") {
                await new Promise((resolve, reject) => {
                    const busboy = Busboy({ headers: req.headers });
                    fields["id"] = result.user.id;
                    
                    // Getting POST form
                    busboy.on("field", (fieldname, val) => {
                        fields[fieldname] = val;
                    });

                    // Getting files
                    busboy.on("file", (fieldname, file, info) => {
                        // Save the file
                        if (fieldname === "img" && info.filename && (path.extname(info.filename) === ".png" || path.extname(info.filename) === ".jpg" || path.extname(info.filename) === ".jpeg")) {
                            const writeStream = fsSync.createWriteStream(path.join(process.cwd(), "static", "images", "users", `${result.user.id}${path.extname(info.filename)}`));
                            file.pipe(writeStream);
                        }
                        
                        // Skip file if it's not valid
                        file.resume();
                    });
                    
                    // POST form was read
                    busboy.on("finish", async () => {
                        // Deleting profile
                        if (fields["type"] === "delete") {
                            await makeApiRequest(`/delete-user/${result.user.id}`, {method: "DELETE"});
                            res.setHeader('Set-Cookie', ['access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT']);
                            res.end();
                        
                        // Editing profile
                        } else if (fields["type"] === "edit") {
                            result = await makeApiRequest("update-user", {
                                method: "PUT",
                                body: fields
                            });
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify(result));
                        }

                        resolve(fields);
                    })

                    // An error has occurred
                    busboy.on("error", async (error) => {
                        logging.error(`An error occurred while serving POST request at ${req.url}:\n${error}`);
                        reject(error);
                    })

                    // Start reading POST form
                    req.pipe(busboy);
                })
            }
        }
    }
}


// Serving logout page
async function logoutPage(req, res, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Deleting cookie
        res.setHeader('Set-Cookie', ['access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT']);
        res.writeHead(302, {'Location': `/login`});
        res.end();

    // Serving POST request
    } else {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end("Method isn't allowed");
    }
}


// Serving error page
async function errorPage(req, res, send_header=true, data={}) {
    // Serving GET request
    if (req.method === "GET") {
        // Sending loading page
        if (send_header) {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write(await renderTemplate("loading.njk", data));
        }

        data.has_searcher = true;
        data.has_login = true;
        data.has_footer = true;
        // Getting user info
        let cookie = await parseCookie(req.headers.cookie);
        if ("access_token" in cookie) {
            let result = await makeApiRequest(`/get-current-user/?access_token=${cookie.access_token}`);
            if (result.status_code === 200 && result.type === "access") {
                data.user = result.user;
            }
        }

        // Sending error page
        res.write(refreshPage(await renderTemplate("error.njk", data)));
        res.end();

    // Serving POST request
    } else {
        res.writeHead(403, {"Content-Type": "text/plain"});
        res.end("Method isn't allowed");
    }
}


// Creating a server
const server = http.createServer(async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Serving requests to static files
        const isStaticFileServed = await serveStaticFile(req, res);
        if (isStaticFileServed) return;


        // /filmizyan/
        if (req.url === "/") {
            await homePage(req, res);

        // /filmizyan/search/мистер_робот
        } else if (req.url.startsWith("/search")) {
            await searchPage(req, res);

        // /filmizyan/film/859908
        } else if (req.url.startsWith("/film")) {
            await filmPage(req, res);

        // /filmizyan/login
        } else if (req.url.startsWith("/login")) {
            await loginPage(req, res);

        // /filmizyan/profile/user/edit
        } else if (req.url.startsWith("/profile") && req.url.endsWith("/edit")) {
            await editProfilePage(req, res);

        // /filmizyan/profile/user
        } else if (req.url.startsWith("/profile")) {
            await profilePage(req, res);

        // /filmizyan/logout
        } else if (req.url.startsWith("/logout")) {
            await logoutPage(req, res);

        // /filmizyan/verify/verification_token
        } else if (req.url.startsWith("/verify")) {
            await verifyToken(req, res);

        // /filmizyan/recovery
        } else if (req.url === "/recovery") {
            await recoveryPage(req, res);

        // /filmizyan/recovery/recovery_token
        } else if (req.url.startsWith("/recovery")) {
            await recoveryToken(req, res);

        // Unknown page
        } else {
            await errorPage(req, res);
        }
        

    // An error has occurred
    } catch (error) {
        logging.error(`An error occurred while serving POST request at ${req.url}:\n${error}`);
        await errorPage(req, res, false);
    }
});


// Running the server
server.listen(PORT, () => {
    logging.info(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});
