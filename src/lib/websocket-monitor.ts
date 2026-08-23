/**
 * Knoux WebSocket System Monitor
 * Real-time system monitoring and live data updates
 */

// Types
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    frequency: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    available: number;
    speed: {
      read: number;
      write: number;
    };
  };
  network: {
    download: number;
    upload: number;
    latency: number;
  };
  gpu?: {
    usage: number;
    memory: number;
    temperature: number;
  };
  power: {
    consumption: number;
    batteryLevel?: number;
    isCharging?: boolean;
  };
}

export interface ProcessMetrics {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  status: "running" | "sleeping" | "stopped";
}

export interface AIModelMetrics {
  modelId: string;
  status: "idle" | "processing" | "loading" | "error";
  memoryUsage: number;
  lastUsed: Date;
  requestCount: number;
  averageProcessingTime: number;
}

export interface MonitoringData {
  system: SystemMetrics;
  processes: ProcessMetrics[];
  aiModels: AIModelMetrics[];
  alerts: Array<{
    id: string;
    type: "warning" | "error" | "info";
    message: string;
    timestamp: Date;
  }>;
}

// WebSocket Monitor Class
export class WebSocketSystemMonitor {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnected = false;
  private listeners: Map<string, Function[]> = new Map();
  private currentData: MonitoringData | null = null;
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(private url?: string) {
    // If no WebSocket URL provided, use simulation mode
    if (!url) {
      this.startSimulation();
    } else {
      this.connect();
    }
  }

  // Start simulation mode for development/demo
  private startSimulation() {
    console.log("📊 بدء محاكاة مراقبة النظام...");

    // Initialize with realistic base values
    let baseMetrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: 25,
        cores: 8,
        temperature: 45,
        frequency: 3200,
      },
      memory: {
        used: 4200,
        total: 16384,
        available: 12184,
        percentage: 25.6,
      },
      disk: {
        used: 256000,
        total: 1024000,
        available: 768000,
        speed: {
          read: 450,
          write: 320,
        },
      },
      network: {
        download: 50,
        upload: 20,
        latency: 25,
      },
      gpu: {
        usage: 15,
        memory: 2048,
        temperature: 42,
      },
      power: {
        consumption: 85,
        batteryLevel: 78,
        isCharging: false,
      },
    };

    // Simulate realistic system processes
    const processes: ProcessMetrics[] = [
      {
        pid: 1234,
        name: "knoux-ai-engine",
        cpuUsage: 5.2,
        memoryUsage: 512,
        status: "running",
      },
      {
        pid: 1235,
        name: "electron-main",
        cpuUsage: 2.1,
        memoryUsage: 256,
        status: "running",
      },
      {
        pid: 1236,
        name: "tensorflow-worker",
        cpuUsage: 8.5,
        memoryUsage: 1024,
        status: "running",
      },
      {
        pid: 1237,
        name: "whisper-transcriber",
        cpuUsage: 1.2,
        memoryUsage: 128,
        status: "sleeping",
      },
    ];

    // AI models metrics
    const aiModels: AIModelMetrics[] = [
      {
        modelId: "gpt4all-falcon",
        status: "idle",
        memoryUsage: 3800,
        lastUsed: new Date(Date.now() - 5000),
        requestCount: 15,
        averageProcessingTime: 2.3,
      },
      {
        modelId: "clip-vision",
        status: "processing",
        memoryUsage: 588,
        lastUsed: new Date(),
        requestCount: 8,
        averageProcessingTime: 1.8,
      },
      {
        modelId: "whisper-large",
        status: "idle",
        memoryUsage: 1500,
        lastUsed: new Date(Date.now() - 30000),
        requestCount: 3,
        averageProcessingTime: 4.1,
      },
    ];

    // Start simulation with realistic variations
    this.simulationInterval = setInterval(() => {
      // Simulate realistic metric changes
      baseMetrics = {
        ...baseMetrics,
        timestamp: new Date(),
        cpu: {
          ...baseMetrics.cpu,
          usage: Math.max(
            5,
            Math.min(95, baseMetrics.cpu.usage + (Math.random() - 0.5) * 10),
          ),
          temperature: Math.max(
            35,
            Math.min(
              85,
              baseMetrics.cpu.temperature + (Math.random() - 0.5) * 3,
            ),
          ),
        },
        memory: {
          ...baseMetrics.memory,
          percentage: Math.max(
            10,
            Math.min(
              90,
              baseMetrics.memory.percentage + (Math.random() - 0.5) * 5,
            ),
          ),
        },
        disk: {
          ...baseMetrics.disk,
          speed: {
            read: Math.max(
              100,
              Math.min(
                800,
                baseMetrics.disk.speed.read + (Math.random() - 0.5) * 50,
              ),
            ),
            write: Math.max(
              50,
              Math.min(
                600,
                baseMetrics.disk.speed.write + (Math.random() - 0.5) * 40,
              ),
            ),
          },
        },
        network: {
          download: Math.max(
            10,
            Math.min(
              200,
              baseMetrics.network.download + (Math.random() - 0.5) * 20,
            ),
          ),
          upload: Math.max(
            5,
            Math.min(
              100,
              baseMetrics.network.upload + (Math.random() - 0.5) * 15,
            ),
          ),
          latency: Math.max(
            10,
            Math.min(
              100,
              baseMetrics.network.latency + (Math.random() - 0.5) * 10,
            ),
          ),
        },
        gpu: baseMetrics.gpu
          ? {
              ...baseMetrics.gpu,
              usage: Math.max(
                0,
                Math.min(
                  100,
                  baseMetrics.gpu.usage + (Math.random() - 0.5) * 15,
                ),
              ),
              temperature: Math.max(
                30,
                Math.min(
                  90,
                  baseMetrics.gpu.temperature + (Math.random() - 0.5) * 5,
                ),
              ),
            }
          : undefined,
        power: {
          ...baseMetrics.power,
          consumption: Math.max(
            50,
            Math.min(
              200,
              baseMetrics.power.consumption + (Math.random() - 0.5) * 10,
            ),
          ),
          batteryLevel: baseMetrics.power.batteryLevel
            ? Math.max(
                5,
                Math.min(
                  100,
                  baseMetrics.power.batteryLevel +
                    (baseMetrics.power.isCharging ? 0.1 : -0.05),
                ),
              )
            : undefined,
        },
      };

      // Update memory usage based on percentage
      baseMetrics.memory.used = Math.round(
        (baseMetrics.memory.total * baseMetrics.memory.percentage) / 100,
      );
      baseMetrics.memory.available =
        baseMetrics.memory.total - baseMetrics.memory.used;

      // Simulate process changes
      processes.forEach((process) => {
        process.cpuUsage = Math.max(
          0,
          Math.min(50, process.cpuUsage + (Math.random() - 0.5) * 2),
        );
        process.memoryUsage = Math.max(
          32,
          Math.min(2048, process.memoryUsage + (Math.random() - 0.5) * 50),
        );

        // Random status changes
        if (Math.random() < 0.05) {
          // 5% chance of status change
          const statuses: ProcessMetrics["status"][] = [
            "running",
            "sleeping",
            "running",
          ]; // Bias towards running
          process.status =
            statuses[Math.floor(Math.random() * statuses.length)];
        }
      });

      // Simulate AI model activity
      aiModels.forEach((model) => {
        // Random model activity
        if (Math.random() < 0.1) {
          // 10% chance of status change
          model.status = model.status === "idle" ? "processing" : "idle";
          if (model.status === "processing") {
            model.lastUsed = new Date();
            model.requestCount++;
          }
        }

        // Update processing time
        if (model.status === "processing") {
          model.averageProcessingTime += (Math.random() - 0.5) * 0.5;
        }
      });

      // Generate alerts based on metrics
      const alerts = [];

      if (baseMetrics.cpu.usage > 80) {
        alerts.push({
          id: `cpu-${Date.now()}`,
          type: "warning" as const,
          message: `استخدام المعالج مرتفع: ${Math.round(baseMetrics.cpu.usage)}%`,
          timestamp: new Date(),
        });
      }

      if (baseMetrics.cpu.temperature > 75) {
        alerts.push({
          id: `temp-${Date.now()}`,
          type: "error" as const,
          message: `درجة حرارة المعالج مرتفعة: ${Math.round(baseMetrics.cpu.temperature)}°C`,
          timestamp: new Date(),
        });
      }

      if (baseMetrics.memory.percentage > 85) {
        alerts.push({
          id: `memory-${Date.now()}`,
          type: "warning" as const,
          message: `استخدام الذاكرة مرتفع: ${Math.round(baseMetrics.memory.percentage)}%`,
          timestamp: new Date(),
        });
      }

      if (
        baseMetrics.power.batteryLevel &&
        baseMetrics.power.batteryLevel < 20
      ) {
        alerts.push({
          id: `battery-${Date.now()}`,
          type: "warning" as const,
          message: `البطارية منخفضة: ${Math.round(baseMetrics.power.batteryLevel)}%`,
          timestamp: new Date(),
        });
      }

      // Update current data
      this.currentData = {
        system: baseMetrics,
        processes: [...processes],
        aiModels: [...aiModels],
        alerts,
      };

      // Emit update to listeners
      this.emit("data", this.currentData);
    }, 2000); // Update every 2 seconds

    this.isConnected = true;
    this.emit("connected");
  }

  // Connect to WebSocket server
  private connect() {
    if (!this.url) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("✅ WebSocket متصل بخادم المراقبة");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const data: MonitoringData = JSON.parse(event.data);
          this.currentData = data;
          this.emit("data", data);
        } catch (error) {
          console.error("خطأ في تحليل بيانات WebSocket:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("❌ انقطع الاتصال بخادم المراقبة");
        this.isConnected = false;
        this.emit("disconnected");
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("خطأ في WebSocket:", error);
        this.emit("error", error);
      };
    } catch (error) {
      console.error("فشل في الاتصال بـ WebSocket:", error);
      this.emit("error", error);
    }
  }

  // Handle reconnection
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("🔄 التبديل إلى وضع المحاكاة بعد فشل الاتصال");
      this.startSimulation();
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 محاولة إعادة الاتصال ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`,
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  // Public methods
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  getCurrentData(): MonitoringData | null {
    return this.currentData;
  }

  requestSnapshot(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "snapshot" }));
    }
  }

  startMonitoring(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "start" }));
    }
  }

  stopMonitoring(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "stop" }));
    }
  }

  // Utility methods
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}د ${hours}س ${minutes}ق`;
    } else if (hours > 0) {
      return `${hours}س ${minutes}ق`;
    } else {
      return `${minutes}ق`;
    }
  }

  getSystemHealth(): {
    overall: "excellent" | "good" | "warning" | "critical";
    score: number;
    issues: string[];
  } {
    if (!this.currentData) {
      return { overall: "critical", score: 0, issues: ["لا توجد بيانات"] };
    }

    const { system } = this.currentData;
    let score = 100;
    const issues: string[] = [];

    // CPU health
    if (system.cpu.usage > 90) {
      score -= 30;
      issues.push("استخدام المعالج مرتفع جداً");
    } else if (system.cpu.usage > 70) {
      score -= 15;
      issues.push("استخدام المعالج مرتفع");
    }

    if (system.cpu.temperature > 80) {
      score -= 25;
      issues.push("درجة حرارة المعالج مرتفعة");
    }

    // Memory health
    if (system.memory.percentage > 90) {
      score -= 25;
      issues.push("استخدام الذاكرة مرتفع جداً");
    } else if (system.memory.percentage > 75) {
      score -= 10;
      issues.push("استخدام الذاكرة مرتفع");
    }

    // Disk health
    const diskUsagePercent = (system.disk.used / system.disk.total) * 100;
    if (diskUsagePercent > 95) {
      score -= 20;
      issues.push("مساحة القرص الصلب ممتلئة");
    } else if (diskUsagePercent > 85) {
      score -= 10;
      issues.push("مساحة القرص الصلب منخفضة");
    }

    // Power health
    if (
      system.power.batteryLevel &&
      system.power.batteryLevel < 10 &&
      !system.power.isCharging
    ) {
      score -= 15;
      issues.push("البطارية منخفضة جداً");
    }

    let overall: "excellent" | "good" | "warning" | "critical";
    if (score >= 90) overall = "excellent";
    else if (score >= 70) overall = "good";
    else if (score >= 50) overall = "warning";
    else overall = "critical";

    return { overall, score, issues };
  }

  // Cleanup
  destroy(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    if (this.ws) {
      this.ws.close();
    }

    this.listeners.clear();
    this.currentData = null;
    this.isConnected = false;
  }
}

// Global monitor instance
export const systemMonitor = new WebSocketSystemMonitor();

// React hook for easy integration
export const useSystemMonitor = () => {
  const [data, setData] = React.useState<MonitoringData | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const handleData = (newData: MonitoringData) => setData(newData);
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    systemMonitor.on("data", handleData);
    systemMonitor.on("connected", handleConnected);
    systemMonitor.on("disconnected", handleDisconnected);

    // Get current data if available
    const currentData = systemMonitor.getCurrentData();
    if (currentData) {
      setData(currentData);
    }

    setIsConnected(systemMonitor.isConnectedToServer());

    return () => {
      systemMonitor.off("data", handleData);
      systemMonitor.off("connected", handleConnected);
      systemMonitor.off("disconnected", handleDisconnected);
    };
  }, []);

  return {
    data,
    isConnected,
    monitor: systemMonitor,
  };
};

export default WebSocketSystemMonitor;
