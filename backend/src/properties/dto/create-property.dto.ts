import {
    IsString,
    IsNotEmpty,
    IsEnum,
    MaxLength,
    IsOptional,
    IsNumber,
    Min,
    Max
} from 'class-validator';

export enum PropertyType {
    BOYS_HOSTEL = 'BOYS_HOSTEL',
    GIRLS_HOSTEL = 'GIRLS_HOSTEL',
    CO_LIVING = 'CO_LIVING',
    PG = 'PG',
    OTHER = 'OTHER',
}

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    address: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    state: string;

    @IsEnum(PropertyType)
    propertyType: PropertyType;

    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;


}