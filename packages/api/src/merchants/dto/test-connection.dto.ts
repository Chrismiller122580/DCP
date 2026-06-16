export class ConnectionTestResultDto {
  ok!: boolean;
  merchantId!: string;
  merchantName!: string;
  apiReachable!: boolean;
  healthStatus?: string;
  xrplConnected?: boolean;
  message!: string;
  testedAt!: string;
}