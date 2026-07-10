const router = require("express").Router();
const auth   = require("../middleware/authMiddleware");
const ctrl   = require("../controllers/solutionController");

router.post("/",        auth, ctrl.create);
router.get("/verify",   auth, (_req, res) => res.json({ ok: true }));
router.get("/",               ctrl.getAll);
router.get("/:slug",          ctrl.getOne);

module.exports = router;