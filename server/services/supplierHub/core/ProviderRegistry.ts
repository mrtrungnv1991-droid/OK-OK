import { ISupplierConnector } from './ISupplierConnector';
import { ConnectionType, SupplierModel } from '../types';
import { AccountSupplierConnector } from '../connectors/AccountSupplierConnector';
import { ApiSupplierConnector } from '../connectors/ApiSupplierConnector';
import { CustomSupplierConnector } from '../connectors/CustomSupplierConnector';

export class ProviderRegistry {
  private static connectorInstances: Map<string, ISupplierConnector> = new Map();

  public static getConnector(supplier: SupplierModel): ISupplierConnector {
    const key = supplier.id;
    if (this.connectorInstances.has(key)) {
      return this.connectorInstances.get(key)!;
    }

    let connector: ISupplierConnector;
    switch (supplier.connectionType) {
      case 'ACCOUNT':
        connector = new AccountSupplierConnector(supplier.id, supplier.name, supplier.websiteUrl, supplier.customAdapterConfig);
        break;
      case 'API':
        connector = new ApiSupplierConnector(supplier.id, supplier.name, supplier.websiteUrl, supplier.customAdapterConfig);
        break;
      case 'CUSTOM':
      default:
        connector = new CustomSupplierConnector(supplier.id, supplier.name, supplier.websiteUrl);
        break;
    }

    this.connectorInstances.set(key, connector);
    return connector;
  }

  public static invalidateConnector(supplierId: string) {
    this.connectorInstances.delete(supplierId);
  }
}
