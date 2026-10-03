import {
  IsObject,
  IsString,
} from 'class-validator';

export class PushSubscriptionDto {
  @IsString()
  endpoint!: string;

  @IsObject()
  keys!: {
    p256dh?: string;
    auth?: string;
  };
}

export class PushUnsubscribeDto {
  @IsString()
  endpoint!: string;
}
