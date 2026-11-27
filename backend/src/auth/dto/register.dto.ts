import {
     IsEmail,
     IsNotEmpty,
     IsString,
     MinLength,
     MaxLength,
} from 'class-validator';

export class RegisterDto{
     @IsString()
     @IsNotEmpty()
     @MaxLength(100)
     name:string;

     @IsEmail()
     email: string;

     @IsString()
     @MinLength(8)
     @MaxLength(100)
     password:string;

     @IsString()
     @IsNotEmpty()
     @MaxLength(150)
     organizationName: string;
}

