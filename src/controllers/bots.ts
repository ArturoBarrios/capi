// src/auth/auth.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { BotsService } from "../services/bots.service";
import { CreateBotsDto, StartBotInteractionsDto } from "../dto/bots.dto";

@Controller("bots")
export class BotsController {
  constructor(
    private authService: AuthService,
    private botsService: BotsService
  ) {}

  @Post("create")
  async signup(@Body() dto: CreateBotsDto) {
    console.log("signup called with:", dto);
    return this.botsService.createBots(dto);
  }

  @Post("start-bots")
  async startBotInteractions(@Body() dto: StartBotInteractionsDto) {
    console.log("Starting bot interactions...");
    return await this.botsService.startBotInteractions(dto);
  }

  @Post("runUserDataCreationService")
  async runUserDataCreationService() {
    console.log("Running user data creation service...");
    return await this.botsService.runUserDataCreationService();
  }
}
