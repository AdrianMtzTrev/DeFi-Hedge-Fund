interface EthereumProvider {
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, handler: (data: any) => void): void;
  removeListener(event: string, handler: (data: any) => void): void;
}

interface Window {
  ethereum?: EthereumProvider;
}

