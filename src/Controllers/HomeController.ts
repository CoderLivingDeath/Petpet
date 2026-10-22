import { Controller, Get, Route } from "tsoa";

@Route('home')
export class UserController extends Controller {
    @Get()
    public async index(): Promise<void> {

    }
}