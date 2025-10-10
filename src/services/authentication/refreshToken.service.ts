import { getConnection, Repository } from "typeorm";
import jwt from "jsonwebtoken";
import { RefreshToken } from "./refreshToken.entity";
import { User } from "../user/user.entity";
import logger from "../../config/logger";

export class RefreshTokenService {
  private refreshTokenRepository: Repository<RefreshToken>;
  private refreshSecret: string = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  private accessSecret: string = process.env.JWT_SECRET;

  constructor() {
    this.refreshTokenRepository = getConnection().getRepository(RefreshToken);
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: "refresh" }, this.refreshSecret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
    });
  }

  /**
   * Generate access token
   */
  public generateAccessToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        displayName: `${user.firstName} ${user.lastName}`,
      },
      this.accessSecret,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
    );
  }

  /**
   * Store refresh token in database
   */
  public async storeRefreshToken(token: string, userId: string): Promise<RefreshToken> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      revoked: false,
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Verify and rotate refresh token
   */
  public async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify token signature
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, this.refreshSecret);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }

    // Check if token exists in database and is not revoked
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ["user"],
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error("Refresh token expired or revoked");
    }

    // Get user
    const userRepository = getConnection().getRepository(User);
    const user = await userRepository.findOne({ where: { id: tokenRecord.userId }, relations: ["roles"] });

    if (!user) {
      throw new Error("User not found");
    }

    // Revoke old token (token rotation)
    tokenRecord.revoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user.id);

    // Store new refresh token
    await this.storeRefreshToken(newRefreshToken, user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Revoke refresh token
   */
  public async revokeRefreshToken(token: string): Promise<void> {
    const tokenRecord = await this.refreshTokenRepository.findOne({ where: { token } });
    if (tokenRecord) {
      tokenRecord.revoked = true;
      await this.refreshTokenRepository.save(tokenRecord);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  public async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId, revoked: false }, { revoked: true });
  }
}

