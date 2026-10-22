import { Router } from "express";
import { home } from "../../views/views";

const router = Router();

router.get("/", (_req, res) => {
    res.sendFile(home)
})

export default router;