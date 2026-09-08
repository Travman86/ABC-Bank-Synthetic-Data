import { Router, type IRouter } from "express";
import healthRouter from "./health";
import statementsRouter from "./statements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(statementsRouter);

export default router;
