import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import { parseToken } from "../../utils/authentication.helper";
import addUserAgent from "../../middleware/ua.middleware";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { authRateLimiter } from "../../middleware/rateLimiter.middleware";
import { Formatter } from "../../utils/formatter";

import UserEmailDto from "./email.dto";
import UserLoginDto from "./login.dto";
import CreateUserDto from "../user/user.dto";
import RequestWithUser from "../../interfaces/request.interface";
import AuthenticationDao from "./authentication.dao";
import { RefreshTokenService } from "./refreshToken.service";
import { AuditLogService } from "./auditLog.service";

/**
 * Handles global route and authentication routes
 */
class AuthenticationController implements Controller {
  public path: string = "";
  public router: Router = Router();

  private fmt: Formatter = new Formatter();
  private authenticationDao: AuthenticationDao = new AuthenticationDao();
  private refreshTokenService: RefreshTokenService = new RefreshTokenService();
  private auditLogService: AuditLogService = new AuditLogService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware); // secure index route (require login)
    this.router.get(`${this.path}/healthz`, this.healthCheck);
    this.router.get(`${this.path}/verify/:token`, addUserAgent, this.verify);
    this.router.post(`${this.path}/login`, authRateLimiter, validationMiddleware(UserLoginDto), addUserAgent, this.login);
    this.router.post(`${this.path}/refresh`, authRateLimiter, this.refresh);
    this.router.post(`${this.path}/impersonate/:id`, authenticationMiddleware, addUserAgent, this.impersonate);
    this.router.post(`${this.path}/logout`, authenticationMiddleware, this.logout);
    this.router.post(`${this.path}/register`, authRateLimiter, validationMiddleware(CreateUserDto), addUserAgent, this.register);
    this.router.post(`${this.path}/lost-password`, validationMiddleware(UserEmailDto), addUserAgent, this.lostPassword);
    this.router.delete(`${this.path}/tokens/:id`, authenticationMiddleware, this.removeToken);
  }

  /**
   * Returns valid token if successful login credentials
   */
  private login = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const loginData: UserLoginDto = request.body;
    const ipAddress = request.ip || request.connection.remoteAddress || "unknown";
    const userAgent = request.headers["user-agent"] || "unknown";

    try {
      const data: any = await this.authenticationDao.login(loginData, request.userAgent);
      
      // Store refresh token
      const refreshToken = this.refreshTokenService.generateRefreshToken(data.user.id);
      await this.refreshTokenService.storeRefreshToken(refreshToken, data.user.id);
      
      // Log successful login
      await this.auditLogService.logEvent(data.user.id, "login", ipAddress, userAgent);
      
      // Add refresh token to response
      const responseData = {
        ...data,
        refreshToken,
      };
      
      response.send(this.fmt.formatResponse(responseData, Date.now() - request.startTime, "OK"));
    } catch (error) {
      // Log failed login attempt
      await this.auditLogService.logEvent(null, "failed_login", ipAddress, userAgent, { email: loginData.email });
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private refresh = async (request: Request, response: Response, next: NextFunction) => {
    const { refreshToken } = request.body;
    const ipAddress = request.ip || request.connection.remoteAddress || "unknown";
    const userAgent = request.headers["user-agent"] || "unknown";

    if (!refreshToken) {
      return response.status(400).send(this.fmt.formatResponse(
        { message: "Refresh token is required" },
        Date.now() - (request as any).startTime,
        "BAD_REQUEST"
      ));
    }

    try {
      const tokens = await this.refreshTokenService.refreshAccessToken(refreshToken);
      
      // Log refresh token event
      const jwt = require("jsonwebtoken");
      const decoded: any = jwt.decode(refreshToken);
      const userId = decoded && decoded.userId ? decoded.userId : null;
      await this.auditLogService.logEvent(userId, "refresh_token", ipAddress, userAgent);
      
      response.send(this.fmt.formatResponse(tokens, Date.now() - (request as any).startTime, "OK"));
    } catch (error) {
      await this.auditLogService.logEvent(null, "failed_refresh", ipAddress, userAgent);
      next(error);
    }
  }

  /**
   * Returns valid token if allowed to impersonate another valid user
   */
  private impersonate = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.authenticationDao.impersonate(request.user, id, request.userAgent);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes token from cache and prevents future requests for that device
   */
  private logout = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const ipAddress = request.ip || request.connection.remoteAddress || "unknown";
    const userAgent = request.headers["user-agent"] || "unknown";
    const { refreshToken } = request.body;

    try {
      const data: any = await this.authenticationDao.logout(request.user, parseToken(request));
      
      // Revoke refresh token if provided
      if (refreshToken) {
        await this.refreshTokenService.revokeRefreshToken(refreshToken);
      }
      
      // Log logout event
      await this.auditLogService.logEvent(request.user.id, "logout", ipAddress, userAgent);
      
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registers new guest user (pending verification) and stores in database
   */
  private register = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const userData: CreateUserDto = request.body;
    const ipAddress = request.ip || request.connection.remoteAddress || "unknown";
    const userAgent = request.headers["user-agent"] || "unknown";

    try {
      const data: any = await this.authenticationDao.register(userData, request.userAgent);
      
      // Log registration event
      if (data && data.id) {
        await this.auditLogService.logEvent(data.id, "register", ipAddress, userAgent);
      }
      
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accepts token in URL and activates user and logs them in if valid
   */
  private verify = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const tempToken: string = request.params.token;

    try {
      const verificationResult: {[key: string]: any} =
              await this.authenticationDao.verifyToken(tempToken, request.userAgent);
      const redirectUrl: string = `${process.env.CLIENT_REDIRECT_URL}?token=${verificationResult.token}`;
      // TODO: require client to register redirect URL at some point (perhaps during register)
      response.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Attempts to send encoded link via email if user email match
   */
  private lostPassword = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const userData: UserEmailDto = request.body;

    try {
      const data: any = await this.authenticationDao.lostPassword(userData, request.userAgent);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private removeToken = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.authenticationDao.removeToken(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sends back successful response if system is running for container
   * orchestration or other load balancing tools
   */
  private healthCheck = async (request: Request, response: Response, next: NextFunction) => {
    response.send(this.fmt.formatResponse({success: true}, 0, "OK"));
  }

}

export default AuthenticationController;
