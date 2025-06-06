import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import User from "../../../models/user.model";
import { ForgotPasswordZodSchema } from "../../../validators/user.validator";
import emailManager from "../../../managers/emailManager";
//import AppError from "../../../utils/AppError";
import { NotFoundError } from "../../../utils/errors";
import catchAsync from "../../../utils/catchAsync";

const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = await ForgotPasswordZodSchema.safeParseAsync(
      req.body
    );

    if (!validatedData.success) {
      res.status(400).json({ errors: validatedData.error.issues });
      return;
    }

    const { email } = validatedData.data;

    const user = await User.findOne({ email });
    if (!user) throw new NotFoundError("User not found with this email.");

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    //const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    //<a href="${resetLink}">${resetLink}</a>

    await emailManager(
      user.email,
      "Password Reset - E-Commerce",
      `<p>You requested to reset your password.</p>
      <p>Paste this code to reset password: ${resetToken}</p>
      <p>This code will expire in 1 hour.</p>`,
      "Password Reset"
    );

    res
      .status(200)
      .json({ message: "Password reset code sent to your email." });
  }
);

export default forgotPassword;
