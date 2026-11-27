
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';

export enum GenderType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  ANY = 'ANY',
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  roomNumber: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  floor?: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(GenderType)
  allowedGender: GenderType;
}
