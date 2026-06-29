import { Module } from '@nestjs/common';
import { PaypalClient } from './paypal.client';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';

@Module({
  controllers: [EscrowController],
  providers: [PaypalClient, EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
