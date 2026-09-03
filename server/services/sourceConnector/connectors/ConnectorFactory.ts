// ==============================================================================
// CYBERPOOL: CONNECTOR FACTORY
// ==============================================================================
import { BaseSourceConnector } from './BaseSourceConnector';
import { GenericBrowserConnector } from './GenericBrowserConnector';
import { MuakeyConnector } from './MuakeyConnector';
import { SourceAccount } from '../types';
import { getScannerProfile } from '../scannerProfile';

export class ConnectorFactory {
  /**
   * Instantiates the matching connector for a source account
   */
  public static createConnector(account: SourceAccount): BaseSourceConnector {
    const profile = getScannerProfile(account.scanner_profile);
    const domain = account.domain.toLowerCase();

    if (domain.includes('muakey')) {
      return new MuakeyConnector(account, profile);
    }

    return new GenericBrowserConnector(account, profile);
  }
}
