import { IsEmail, IsString, Matches, MinLength, MaxLength } from 'class-validator';
export class EmailDto {
  @IsEmail() @MaxLength(254) email: string;
}
export class VerifyEmailDto extends EmailDto {
  @IsString() @Matches(/^\d{6}$/) code: string;
}
export class ResetPasswordDto extends VerifyEmailDto {
  @IsString() @MinLength(8) @MaxLength(72) password: string;
}
