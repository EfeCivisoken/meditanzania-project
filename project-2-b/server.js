const express = require("express");
const session = require("express-session");
const passport = require("passport");
const {
  serializeUser,
  deserializeUser,
  authenticationStrategy,
} = require("./helpers/authentication");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const i18n = require("i18n");
const path = require("path");
const multer = require("multer");

const { topNLowN, goToTopNLowN } = require("./controllers/scoreTopNLowN");

const upload = multer({ dest: "./uploads" });

const app = express();
const PORT = 3000;

// Import routes

const {
  listFacilities,
  createFacility,
  viewFacility,
  updateFacility,
  activateFacility,
  deactivateFacility,
  updateScores,
} = require("./controllers/admin/facilities");
const { index, about } = require("./controllers/index");
const {
  listSurveys,
  uploadSurvey,
  viewSurvey,
  updateSurvey,
} = require("./controllers/admin/surveys");
const {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require("./controllers/admin/locations");
const { search } = require("./controllers/search");
const {
  viewQuestion,
  updateQuestion,
  createCategory,
} = require("./controllers/admin/questions");
const {
  getUploadResponse,
  uploadResponse,
} = require("./controllers/admin/responses");

const { updatePass, updatePassForm } = require("./controllers/user");

const { getLogin, logout } = require("./controllers/authentication");
const facilityView = require("./controllers/facility");
const { viewPanel } = require("./controllers/admin/admin");
const {
  listUsers,
  createUser,
  viewUser,
  updateUser,
  setUserJurisdiction,
  deleteUser,
} = require("./controllers/admin/users");

const {
  addFacility,
  removeFacility,
  compare,
} = require("./controllers/compare");

// Configure i18n
i18n.configure({
  locales: ["en", "sw"],
  defaultLocale: "en",
  directory: path.join("locales"),
  updateFiles: false,
  directoryPermissions: "755",
  objectNotation: true,
});

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());

// Authentication
var sessionInit = {
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {},
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionInit.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionInit));

app.use(cookieParser());

app.use(i18n.init);

app.use((req, res, next) => {
  const localeFromCookie = req.cookies.locale;
  if (localeFromCookie) {
    req.setLocale(localeFromCookie);
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    authenticationStrategy
  )
);

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

// language route handler
app.get("/change-language/:lang", (req, res) => {
  const lang = req.params.lang;

  if (["en", "sw"].includes(lang)) {
    res.cookie("locale", lang, { maxAge: 1000 * 60 * 60 * 24 * 30 }); // 30 days
    // This changes the language for the current request
    res.setLocale(lang);
  }

  // Redirect back to the referring page or home page
  res.redirect(req.headers.referer || "/");
});

// define routes here

// index
app.get("/", index);

// Authentication routes
app.post(
  "/auth/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true, // allows us to get error message on the next page
  })
);

// User Authentication
app.get("/auth/logout", logout);
app.get("/auth/login", getLogin);

// View Facilities
app.get("/facilities/:id/citizen", facilityView.citizenFacilityView);
app.get("/facilities/:id/staff", facilityView.staffFacilityView);
app.get("/facilities/:id", facilityView.conditionalFacilityView);
app.get("/facilities", search);
app.post("/facilityView/:id/post", facilityView.createPost);

// Comparing Facilities
app.post("/compare/add", addFacility);
app.post("/compare/remove", removeFacility);
app.get("/compare", compare);

// Update password
app.get("/user/updatepass", updatePassForm);
app.post("/user/updatepass", updatePass);

// Admin Panel
app.get("/admin", viewPanel);

// View About page
app.get("/about", about);

// Admin Panel: Users
app.get("/admin/users", listUsers);
app.post("/admin/users/create", createUser);
app.get("/admin/users/:id", viewUser);
app.post("/admin/users/:id/update", updateUser);
app.post("/admin/users/:id/jurisdiction", setUserJurisdiction);
app.get("/admin/users/:id/delete", deleteUser);

// Admin Panel: Facilities
app.get("/admin/facilities", listFacilities);
app.post("/admin/facilities/create", createFacility);
app.get("/admin/facilities/:id", viewFacility);
app.post("/admin/facilities/:id/update", updateFacility);
app.get("/admin/facilities/:id/activate", activateFacility);
app.get("/admin/facilities/:id/deactivate", deactivateFacility);
app.get("/admin/updatefacilityscores", updateScores);

// Admin Panel: Surveys
app.get("/admin/surveys", listSurveys);
app.post("/admin/surveys/create", upload.array("csv"), uploadSurvey);
app.get("/admin/surveys/:id", viewSurvey);
app.post("/admin/surveys/:id/update", updateSurvey);

// Admin Panel: Responses
app.get("/admin/responses", getUploadResponse);
app.post("/admin/responses/upload", upload.array("csv"), uploadResponse);

// Admin Panel: Locations
app.get("/admin/locations", listLocations);
app.post("/admin/locations/regions/create", async (req, res) => {
  createLocation(req, res, "Region");
});
app.post("/admin/locations/districts/create", async (req, res) => {
  createLocation(req, res, "District");
});
app.post("/admin/locations/wards/create", async (req, res) => {
  createLocation(req, res, "Ward");
});
app.post("/admin/locations/municipalities/create", async (req, res) => {
  createLocation(req, res, "Municipality");
});

app.post("/admin/locations/regions/:id/update", async (req, res) => {
  updateLocation(req, res, "Region");
});
app.post("/admin/locations/districts/:id/update", async (req, res) => {
  updateLocation(req, res, "District");
});
app.post("/admin/locations/wards/:id/update", async (req, res) => {
  updateLocation(req, res, "Ward");
});
app.post("/admin/locations/municipalities/:id/update", async (req, res) => {
  updateLocation(req, res, "Municipality");
});

app.get("/admin/locations/regions/:id/delete", async (req, res) => {
  deleteLocation(req, res, "Region");
});
app.get("/admin/locations/districts/:id/delete", async (req, res) => {
  deleteLocation(req, res, "District");
});
app.get("/admin/locations/wards/:id/delete", async (req, res) => {
  deleteLocation(req, res, "Ward");
});
app.get("/admin/locations/municipalities/:id/delete", async (req, res) => {
  deleteLocation(req, res, "Municipality");
});

// Admin Panel: Survey Questions
app.get("/admin/surveys/questions/:id", viewQuestion);
app.post("/admin/surveys/questions/:id/update", updateQuestion);

// Admin Panel: Survey Question Categories
app.post("/admin/surveys/questions/categories/create", createCategory);

// Top N and Low N (all users)
app.get("/topnlown/setup/", goToTopNLowN); // this is the endpoint for when user first click to view
app.get("/topnlown/", topNLowN); // then it gets redirected here

module.exports = app;

if (process.env.NODE_ENV != "test") {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}
