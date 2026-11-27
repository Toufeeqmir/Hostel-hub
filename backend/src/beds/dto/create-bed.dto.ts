import {
    IsString,
    IsNotEmpty,
    MaxLength,
} from 'class-validator';

export class CreateBedDto{
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    bedNumber: string;
}