import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { toast } from 'sonner';
import { blockchainService } from '../utils/blockchain';
import { ethers } from 'ethers';

interface DepositWithdrawProps {
  walletBalance: number;
  depositedAmount: number;
  walletAddress: string | null;
  onDeposit: (amount: number, txHash: string) => void;
  onWithdraw: (amount: number, txHash: string) => void;
}

export function DepositWithdraw({ 
  walletBalance, 
  depositedAmount,
  walletAddress,
  onDeposit, 
  onWithdraw 
}: DepositWithdrawProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Direcciones de contratos
  const FUND_CONTRACT_ADDRESS = '0xF2aC145700F1F1eeFD3c8F3923E9D15B18De412f'; // Vault
  const LINK_TOKEN_ADDRESS = '0xb1D4538B4571d411F07960EF2838Ce337FE1E80E'; // LINK token en Arbitrum Sepolia

  const handleDeposit = async () => {
    if (!walletAddress) {
      toast.error('Conecta tu billetera primero');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    setIsProcessing(true);
    try {
      toast.info('Verificando configuración del contrato...');
      
      // Verificar que el contrato Vault esté inicializado con LINK
      const vaultCheck = await blockchainService.checkVaultInitialized(
        FUND_CONTRACT_ADDRESS, 
        LINK_TOKEN_ADDRESS
      );
      
      if (!vaultCheck.initialized) {
        let errorMsg = 'El contrato Vault no está configurado correctamente.';
        let canInitialize = false;
        
        if (vaultCheck.error) {
          errorMsg = vaultCheck.error;
          // Si el contrato no está inicializado, ofrecer inicializarlo
          if (vaultCheck.error.includes('no está inicializado') || vaultCheck.error.includes('initialize()')) {
            canInitialize = true;
          }
        } else if (vaultCheck.currentAsset) {
          errorMsg = `El contrato está inicializado con ${vaultCheck.currentAsset}, pero necesita estar con LINK (${LINK_TOKEN_ADDRESS})`;
        } else {
          errorMsg = 'El contrato Vault no está inicializado.';
          canInitialize = true;
        }
        
        // Agregar información adicional si está disponible
        if (vaultCheck.details) {
          if (vaultCheck.details.minDeposit) {
            const minDepositEth = ethers.formatEther(vaultCheck.details.minDeposit);
            errorMsg += `\n\nCantidad mínima requerida: ${minDepositEth} tokens`;
          }
          if (vaultCheck.details.paused !== undefined) {
            errorMsg += `\nContrato pausado: ${vaultCheck.details.paused ? 'Sí' : 'No'}`;
          }
        }
        
        // Si puede inicializar, mostrar opción
        if (canInitialize) {
          const shouldInitialize = confirm(
            errorMsg + 
            '\n\n¿Deseas inicializar el contrato Vault con LINK ahora?\n\n' +
            'Esto requiere permisos de administrador del contrato.'
          );
          
          if (shouldInitialize) {
            try {
              toast.info('Inicializando contrato Vault con LINK...');
              const initHash = await blockchainService.initializeVault(
                FUND_CONTRACT_ADDRESS,
                LINK_TOKEN_ADDRESS
              );
              
              if (initHash) {
                toast.success(`Contrato inicializado! Hash: ${initHash.substring(0, 10)}...`);
                // Esperar un momento para que se confirme
                await new Promise(resolve => setTimeout(resolve, 3000));
                // Intentar de nuevo el depósito
                toast.info('Reintentando depósito...');
                // Continuar con el flujo de depósito
              }
            } catch (initError: any) {
              let errorMsg = 'Error al inicializar el contrato.';
              
              if (initError.message) {
                errorMsg = initError.message;
              } else if (initError.reason) {
                errorMsg = `Error: ${initError.reason}`;
              }
              
              // Mensaje más claro si no tiene permisos
              if (errorMsg.includes('permisos') || errorMsg.includes('owner') || errorMsg.includes('admin')) {
                errorMsg = '❌ No tienes permisos para inicializar el contrato.\n\n' +
                  'Necesitas ser el owner/admin del contrato Vault para inicializarlo.\n\n' +
                  'Contacta al dueño del contrato o verifica que tu wallet tenga permisos de administrador.';
              }
              
              toast.error(errorMsg, { duration: 15000 });
              console.error('Error completo de inicialización:', initError);
              setIsProcessing(false);
              return;
            }
          } else {
            toast.error(errorMsg, { duration: 12000 });
            setIsProcessing(false);
            return;
          }
        } else {
          toast.error(errorMsg, { duration: 12000 });
          console.error('Detalles del contrato:', vaultCheck);
          setIsProcessing(false);
          return;
        }
      }
      
      // Mostrar información útil si está disponible
      if (vaultCheck.details?.minDeposit) {
        const minDepositEth = ethers.formatEther(vaultCheck.details.minDeposit);
        console.log(`Cantidad mínima de depósito: ${minDepositEth} tokens`);
      }
      
      toast.success('✓ Contrato Vault verificado correctamente');
      
      toast.info('Verificando balance de LINK...');
      
      // Obtener balance de LINK del usuario
      const linkBalance = await blockchainService.getTokenBalance(walletAddress, LINK_TOKEN_ADDRESS);
      const linkDecimals = await blockchainService.getTokenDecimals(LINK_TOKEN_ADDRESS);
      
      // Convertir USD a LINK (precio aproximado de LINK ~$14)
      const linkPriceUSD = 14; // Actualiza este valor con un oracle real
      const linkAmount = (amount / linkPriceUSD).toFixed(6);
      
      if (parseFloat(linkAmount) > parseFloat(linkBalance)) {
        toast.error(`Balance insuficiente de LINK. Tienes: ${parseFloat(linkBalance).toFixed(4)} LINK`);
        setIsProcessing(false);
        return;
      }

      toast.info(`Depositando ${parseFloat(linkAmount).toFixed(4)} LINK...`);

      // Verificar si necesita aprobar primero
      const allowance = await blockchainService.getTokenAllowance(walletAddress, LINK_TOKEN_ADDRESS, FUND_CONTRACT_ADDRESS);
      const linkAmountWei = ethers.parseUnits(linkAmount, linkDecimals);
      
      if (allowance < linkAmountWei) {
        toast.info('Aprobando LINK token. Confirma la transacción en MetaMask...');
        try {
          const approveHash = await blockchainService.approveToken(
            LINK_TOKEN_ADDRESS,
            FUND_CONTRACT_ADDRESS,
            linkAmount
          );
          
          if (approveHash) {
            toast.success('Token aprobado. Esperando confirmación de la blockchain...');
            // Esperar más tiempo para asegurar que la aprobación esté confirmada
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        } catch (approveError: any) {
          toast.error(`Error al aprobar: ${approveError.message || 'Error desconocido'}`);
          setIsProcessing(false);
          return;
        }
      } else {
        toast.info('Allowance suficiente. Procediendo con el depósito...');
      }

      // Llamar al método deposit del contrato Vault con LINK token
      // deposit(uint256 assets, address receiver)
      // El contrato transferirá los tokens automáticamente usando safeTransferFrom
      toast.info('Ejecutando depósito. Confirma la transacción en MetaMask...');
      const txHash = await blockchainService.depositToVault(
        FUND_CONTRACT_ADDRESS,
        linkAmount,
        walletAddress, // receiver es la dirección del usuario
        LINK_TOKEN_ADDRESS, // token address
        linkDecimals // decimals del token
      );
      
      if (txHash) {
        onDeposit(amount, txHash);
        setDepositAmount('');
        toast.success(`Depósito exitoso! Hash: ${txHash.substring(0, 10)}...`);
      }
    } catch (error: any) {
      console.error('Error en depósito:', error);
      
      let errorMessage = 'Error al procesar el depósito.';
      
      if (error.message) {
        // Si el mensaje tiene saltos de línea, mostrarlos
        errorMessage = error.message;
      } else if (error.reason) {
        errorMessage = `Error del contrato: ${error.reason}`;
      } else {
        errorMessage = 'Error desconocido. Abre la consola (F12) para más detalles.';
      }
      
      // Mostrar el error completo en un toast largo
      toast.error(errorMessage, {
        duration: 8000, // Mostrar por más tiempo
      });
      
      console.error('Detalles completos del error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletAddress) {
      toast.error('Conecta tu billetera primero');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    if (amount > depositedAmount) {
      toast.error('Balance depositado insuficiente');
      return;
    }

    setIsProcessing(true);
    try {
      // Llamar al método withdraw del contrato Vault
      // withdraw(uint256 assets, address receiver, address owner)
      const ethAmount = (amount / 2500).toFixed(6);
      
      const txHash = await blockchainService.withdrawFromVault(
        FUND_CONTRACT_ADDRESS,
        ethAmount,
        walletAddress, // receiver
        walletAddress  // owner
      );
      
      if (txHash) {
        onWithdraw(amount, txHash);
        setWithdrawAmount('');
        toast.success(`Retiro exitoso! Hash: ${txHash.substring(0, 10)}...`);
      }
    } catch (error: any) {
      console.error('Error en retiro:', error);
      if (error.reason) {
        toast.error(`Error: ${error.reason}`);
      } else if (error.message) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Error al procesar el retiro. Verifica tu balance depositado.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Depositar</TabsTrigger>
          <TabsTrigger value="withdraw">Retirar</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Balance Disponible</p>
            <p className="text-gray-900 dark:text-gray-100">${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-500">Depositando con LINK token</p>
            <p className="text-xs text-gray-400 mt-1">
              Contrato Vault: {FUND_CONTRACT_ADDRESS.substring(0, 6)}...{FUND_CONTRACT_ADDRESS.substring(38)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-gray-700 dark:text-gray-300">Cantidad a Depositar (USD)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="text-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDepositAmount((walletBalance * 0.25).toFixed(2))}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDepositAmount((walletBalance * 0.5).toFixed(2))}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDepositAmount((walletBalance * 0.75).toFixed(2))}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDepositAmount(walletBalance.toFixed(2))}
              >
                MAX
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleDeposit} 
            className="w-full gap-2"
            disabled={isProcessing}
          >
            <ArrowDownToLine className="w-4 h-4" />
            {isProcessing ? 'Procesando...' : 'Depositar al Fondo'}
          </Button>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Balance Depositado</p>
            <p className="text-gray-900 dark:text-gray-100">${depositedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-500">≈ {((depositedAmount / 2500)).toFixed(6)} ETH</p>
          </div>

          <div className="space-y-2">
            <label className="text-gray-700 dark:text-gray-300">Cantidad a Retirar (USD)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="text-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWithdrawAmount((depositedAmount * 0.25).toFixed(2))}
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWithdrawAmount((depositedAmount * 0.5).toFixed(2))}
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWithdrawAmount((depositedAmount * 0.75).toFixed(2))}
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWithdrawAmount(depositedAmount.toFixed(2))}
              >
                MAX
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleWithdraw} 
            className="w-full gap-2" 
            variant="outline"
            disabled={isProcessing}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            {isProcessing ? 'Procesando...' : 'Retirar del Fondo'}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
