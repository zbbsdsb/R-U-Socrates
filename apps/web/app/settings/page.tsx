import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your model providers and preferences.
        </p>
      </div>

      {/* Model configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Model Providers</CardTitle>
          <CardDescription>
            Configure API keys for LLM providers. Keys are stored locally and never sent to a third-party server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "OpenAI", key: "OPENAI_API_KEY", placeholder: "sk-..." },
            { name: "DeepSeek", key: "DEEPSEEK_API_KEY", placeholder: "sk-..." },
            { name: "Anthropic", key: "ANTHROPIC_API_KEY", placeholder: "sk-ant-..." },
          ].map(({ name, key, placeholder }) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium">{name}</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder={placeholder}
                  className="flex-1"
                />
                <Button variant="outline">Save</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Default model */}
      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
          <CardDescription>Default settings for new tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Model</label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>gpt-4o</option>
              <option>deepseek-chat</option>
              <option>claude-3-5-sonnet</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Nodes per Task</label>
            <Input type="number" defaultValue={20} min={1} max={100} className="w-32" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save All Settings</Button>
      </div>
    </div>
  );
}
