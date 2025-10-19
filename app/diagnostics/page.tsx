import { AuthWrapper } from "@/components/auth-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/app-layout"

export default function DiagnosticsPage() {
  return (
    <AuthWrapper>
      <AppLayout>
        <div className="h-full p-6 overflow-auto">
          <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-mono">SYSTEM DIAGNOSTICS</h1>
            <p className="text-muted-foreground mt-2 font-mono">Hardware status and configuration parameters</p>
          </div>

          <Tabs defaultValue="hardware" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hardware" className="font-mono">
                HARDWARE
              </TabsTrigger>
              <TabsTrigger value="sensors" className="font-mono">
                SENSORS
              </TabsTrigger>
              <TabsTrigger value="parameters" className="font-mono">
                PARAMETERS
              </TabsTrigger>
              <TabsTrigger value="firmware" className="font-mono">
                FIRMWARE
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hardware" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">FLIGHT CONTROLLER</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">MODEL</span>
                      <span>PIXHAWK 6X</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">CPU LOAD</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">MEMORY</span>
                      <span>156/512 MB</span>
                    </div>
                    <Progress value={30} className="h-2" />
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">TEMPERATURE</span>
                      <span className="text-green-500">42°C</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">POWER SYSTEM</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">BATTERY VOLTAGE</span>
                      <span className="text-green-500">24.2V</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">CURRENT DRAW</span>
                      <span>3.2A</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">CAPACITY USED</span>
                      <span>1240 mAh</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">REMAINING</span>
                      <span className="text-green-500">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">MOTORS & ESC</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[1, 2, 3, 4].map((motor) => (
                      <div key={motor} className="flex justify-between text-sm font-mono">
                        <span className="text-muted-foreground">MOTOR {motor}</span>
                        <Badge variant="outline" className="font-mono">
                          OPERATIONAL
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">COMMUNICATION</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">TELEMETRY LINK</span>
                      <Badge className="font-mono bg-green-500">ACTIVE</Badge>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">RSSI</span>
                      <span className="text-green-500">-45 dBm</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">LATENCY</span>
                      <span className="text-green-500">42ms</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">PACKET LOSS</span>
                      <span className="text-green-500">0.02%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">IMU (INERTIAL MEASUREMENT UNIT)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">STATUS</span>
                      <Badge className="font-mono bg-green-500">CALIBRATED</Badge>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">ACCEL X/Y/Z</span>
                      <span>0.02 / -0.01 / 9.81 m/s²</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">GYRO X/Y/Z</span>
                      <span>0.001 / 0.002 / -0.001 rad/s</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">TEMPERATURE</span>
                      <span className="text-green-500">38°C</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-mono bg-transparent">
                      RECALIBRATE
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">MAGNETOMETER</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">STATUS</span>
                      <Badge className="font-mono bg-green-500">CALIBRATED</Badge>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">MAG X/Y/Z</span>
                      <span>234 / -156 / 412 mGauss</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">HEADING</span>
                      <span>127°</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">DECLINATION</span>
                      <span>-12.5°</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-mono bg-transparent">
                      RECALIBRATE
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">BAROMETER</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">STATUS</span>
                      <Badge className="font-mono bg-green-500">OPERATIONAL</Badge>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">PRESSURE</span>
                      <span>1013.25 hPa</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">ALTITUDE</span>
                      <span>0.0 m MSL</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">TEMPERATURE</span>
                      <span>24°C</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-mono">VISUAL ODOMETRY</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">STATUS</span>
                      <Badge className="font-mono bg-green-500">TRACKING</Badge>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">FEATURES</span>
                      <span>342 tracked</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">QUALITY</span>
                      <span className="text-green-500">EXCELLENT</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">FPS</span>
                      <span>30</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">PARAMETER EDITOR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground font-mono mb-4">
                      Modify flight controller parameters. Changes require reboot.
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-auto">
                      {[
                        { name: "MC_ROLL_P", value: "6.5", desc: "Roll P gain" },
                        { name: "MC_ROLL_I", value: "0.3", desc: "Roll I gain" },
                        { name: "MC_ROLL_D", value: "0.18", desc: "Roll D gain" },
                        { name: "MC_PITCH_P", value: "6.5", desc: "Pitch P gain" },
                        { name: "MC_PITCH_I", value: "0.3", desc: "Pitch I gain" },
                        { name: "MC_PITCH_D", value: "0.18", desc: "Pitch D gain" },
                        { name: "MC_YAW_P", value: "2.8", desc: "Yaw P gain" },
                        { name: "MC_YAW_I", value: "0.2", desc: "Yaw I gain" },
                        { name: "MPC_XY_VEL_MAX", value: "12.0", desc: "Max horizontal velocity" },
                        { name: "MPC_Z_VEL_MAX_UP", value: "3.0", desc: "Max ascent velocity" },
                        { name: "MPC_Z_VEL_MAX_DN", value: "1.5", desc: "Max descent velocity" },
                        { name: "RTL_RETURN_ALT", value: "50.0", desc: "Return altitude" },
                      ].map((param) => (
                        <div key={param.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-mono text-sm font-bold">{param.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{param.desc}</div>
                          </div>
                          <input
                            type="text"
                            defaultValue={param.value}
                            className="w-24 px-3 py-1 bg-background border border-border rounded font-mono text-sm text-right"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <Button variant="outline" className="flex-1 font-mono bg-transparent">
                        RESET TO DEFAULTS
                      </Button>
                      <Button className="flex-1 font-mono">SAVE & REBOOT</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="firmware" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">FIRMWARE MANAGEMENT</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">CURRENT VERSION</span>
                      <span className="font-bold">v1.14.3</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">BUILD DATE</span>
                      <span>2024-01-15</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">BOARD</span>
                      <span>PIXHAWK 6X</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">BOOTLOADER</span>
                      <span>v5.2.0</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="text-sm font-mono font-bold">AVAILABLE UPDATES</div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm font-bold">v1.15.0</div>
                          <div className="text-xs text-muted-foreground font-mono">Released 2024-02-01</div>
                        </div>
                        <Badge className="font-mono bg-primary">STABLE</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground font-mono">
                        • Improved SLAM performance
                        <br />• Enhanced obstacle avoidance
                        <br />• Bug fixes and stability improvements
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 font-mono bg-transparent">
                      UPLOAD CUSTOM
                    </Button>
                    <Button className="flex-1 font-mono">INSTALL UPDATE</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </AppLayout>
    </AuthWrapper>
  )
}
