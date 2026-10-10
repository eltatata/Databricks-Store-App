import { type BasePluginConfig, Plugin, type PluginManifest, toPlugin } from '@databricks/appkit';
import {
  type AgentToolDefinition,
  executeFromRegistry,
  type ToolkitEntry,
  type ToolkitOptions,
  type ToolRegistry,
  toolsFromRegistry,
} from '@databricks/appkit/beta';
import { buildStoreTools } from './tools';

export const STORE_TOOLS_PLUGIN_NAME = 'store';

function toToolkitKey(localName: string, options: ToolkitOptions): string | null {
  if (options.only && !options.only.includes(localName)) {
    return null;
  }
  if (options.except?.includes(localName)) {
    return null;
  }
  return options.rename?.[localName] || `${options.prefix ?? `${STORE_TOOLS_PLUGIN_NAME}.`}${localName}`;
}

interface StoreToolsConfig extends BasePluginConfig {
  devUserEmail?: string;
}

class StoreToolsPlugin extends Plugin<StoreToolsConfig> {
  static manifest = {
    name: STORE_TOOLS_PLUGIN_NAME,
    displayName: 'Store tools',
    description: 'Agent tools over the store KPIs and product catalog in Lakebase',
    resources: { required: [], optional: [] },
  } satisfies PluginManifest<typeof STORE_TOOLS_PLUGIN_NAME>;

  private readonly tools: ToolRegistry;

  constructor(config: StoreToolsConfig) {
    super(config);
    this.tools = buildStoreTools({ devUserEmail: config.devUserEmail });
  }

  getAgentTools(): AgentToolDefinition[] {
    return toolsFromRegistry(this.tools);
  }

  toolkit(options: ToolkitOptions = {}): Record<string, ToolkitEntry> {
    return Object.fromEntries(
      this.getAgentTools().flatMap((definition) => {
        const key = toToolkitKey(definition.name, options);
        if (!key) {
          return [];
        }
        const entry: ToolkitEntry = {
          __toolkitRef: true,
          pluginName: STORE_TOOLS_PLUGIN_NAME,
          localName: definition.name,
          def: { ...definition, name: key },
          annotations: definition.annotations,
        };
        return [[key, entry]];
      })
    );
  }

  executeAgentTool(name: string, args: unknown, signal?: AbortSignal): Promise<unknown> {
    return executeFromRegistry(this.tools, name, args, signal);
  }
}

export const storeTools = toPlugin(StoreToolsPlugin);
