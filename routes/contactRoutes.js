const express = require("express");
const router = express.Router();
const { 
    getContact,
    getContacts,
    createContact,
    updateContact,
    deleteContact,
  } = require('../controllers/contactController');
const validateToken = require('../middleware/validateTokenHandler');


router.use(validateToken);

router
  .route("/")
  .get(getContacts)
  .post(createContact);

router
  .route("/:id")
  .get(getContact)
  .put(updateContact)
  .delete(deleteContact);

//   router.route("/:id").get((req, res) => {
//     res.status(200).json({
//       message: `Get contact for ${req.params.id}`,
//     });
//   });

// router.route("/").post((req, res) => {
//   res.status(200).json({
//     message: "Create Contacts",
//   });
// });

// router.route("/:id").put((req, res) => {
//   res.status(200).json({
//     message: `Update contact for ${req.params.id}`,
//   });
// });

// router.route("/:id").delete((req, res) => {
//   res.status(200).json({
//     message: `Delete contact for ${req.params.id}`,
//   });
// });

module.exports = router;
