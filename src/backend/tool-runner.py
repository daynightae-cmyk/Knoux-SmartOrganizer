#!/usr/bin/env python3
"""
Knoux SmartOrganizer - Tool Runner Backend
Executes PowerShell, Python, and Node.js scripts for all tools
"""

import os
import sys
import json
import subprocess
import threading
import time
import psutil
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/tool-runner.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class KnouxToolRunner:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.tools_dir = Path("tools")
        self.models_dir = Path("models")
        self.state_file = self.data_dir / "state.json"
        self.sections_file = self.data_dir / "sections.json"
        
        # Ensure directories exist
        self.data_dir.mkdir(exist_ok=True)
        self.tools_dir.mkdir(exist_ok=True)
        self.models_dir.mkdir(exist_ok=True)
        Path("logs").mkdir(exist_ok=True)
        
        # Load sections configuration
        self.sections = self.load_sections()
        
        # Initialize state
        self.state = self.load_state()
        
        # Running processes
        self.running_processes: Dict[str, subprocess.Popen] = {}
        
        logger.info("KnouxToolRunner initialized")

    def load_sections(self) -> Dict:
        """Load sections configuration"""
        try:
            with open(self.sections_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error("sections.json not found")
            return {"sections": []}

    def load_state(self) -> Dict:
        """Load current state"""
        try:
            with open(self.state_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                "last_update": datetime.now().isoformat(),
                "system_metrics": {},
                "tool_executions": {},
                "active_processes": [],
                "performance_stats": {
                    "files_processed": 0,
                    "duplicates_found": 0,
                    "space_saved_mb": 0.0,
                    "total_runtime_seconds": 0
                }
            }

    def save_state(self):
        """Save current state to file"""
        self.state["last_update"] = datetime.now().isoformat()
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)

    def get_system_metrics(self) -> Dict[str, Any]:
        """Get real-time system metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_io = psutil.disk_io_counters()
            
            # Network metrics
            network = psutil.net_io_counters()
            
            # Process count
            process_count = len(psutil.pids())
            
            metrics = {
                "timestamp": datetime.now().isoformat(),
                "cpu": {
                    "usage_percent": cpu_percent,
                    "count": cpu_count,
                    "frequency_mhz": cpu_freq.current if cpu_freq else 0
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "used_gb": round(memory.used / (1024**3), 2),
                    "percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "percent": round((disk.used / disk.total) * 100, 1),
                    "read_bytes": disk_io.read_bytes if disk_io else 0,
                    "write_bytes": disk_io.write_bytes if disk_io else 0
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv
                },
                "processes": {
                    "total_count": process_count,
                    "knoux_processes": len(self.running_processes)
                }
            }
            
            # Update state
            self.state["system_metrics"] = metrics
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting system metrics: {e}")
            return {}

    def find_tool(self, tool_id: str) -> Optional[Dict]:
        """Find tool configuration by ID"""
        for section in self.sections.get("sections", []):
            for tool in section.get("tools", []):
                if tool.get("id") == tool_id:
                    return {**tool, "section_id": section.get("id")}
        return None

    def execute_powershell_script(self, script_path: str, args: List[str] = None) -> subprocess.Popen:
        """Execute PowerShell script"""
        if args is None:
            args = []
        
        cmd = [
            "powershell.exe",
            "-ExecutionPolicy", "Bypass",
            "-File", str(script_path)
        ] + args
        
        return subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )

    def execute_python_script(self, script_path: str, args: List[str] = None) -> subprocess.Popen:
        """Execute Python script"""
        if args is None:
            args = []
        
        cmd = [sys.executable, str(script_path)] + args
        
        return subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )

    def execute_node_script(self, script_path: str, args: List[str] = None) -> subprocess.Popen:
        """Execute Node.js script"""
        if args is None:
            args = []
        
        cmd = ["node", str(script_path)] + args
        
        return subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )

    def run_tool(self, tool_id: str, args: List[str] = None) -> Dict[str, Any]:
        """Execute a tool by ID"""
        tool = self.find_tool(tool_id)
        if not tool:
            return {
                "success": False,
                "error": f"Tool {tool_id} not found",
                "tool_id": tool_id
            }

        script_path = Path(tool["script"])
        if not script_path.exists():
            return {
                "success": False,
                "error": f"Script not found: {script_path}",
                "tool_id": tool_id
            }

        try:
            # Determine execution method based on file extension or type
            script_type = tool.get("type", "").lower()
            if script_type == "powershell" or script_path.suffix == ".ps1":
                process = self.execute_powershell_script(script_path, args)
            elif script_path.suffix == ".py":
                process = self.execute_python_script(script_path, args)
            elif script_path.suffix == ".js":
                process = self.execute_node_script(script_path, args)
            else:
                return {
                    "success": False,
                    "error": f"Unsupported script type: {script_path.suffix}",
                    "tool_id": tool_id
                }

            # Store running process
            self.running_processes[tool_id] = process
            
            # Update execution state
            execution_state = {
                "tool_id": tool_id,
                "status": "running",
                "start_time": datetime.now().isoformat(),
                "pid": process.pid,
                "script_path": str(script_path),
                "args": args or []
            }
            
            self.state["tool_executions"][tool_id] = execution_state
            self.save_state()
            
            logger.info(f"Started tool {tool_id} with PID {process.pid}")
            
            return {
                "success": True,
                "tool_id": tool_id,
                "pid": process.pid,
                "status": "running",
                "message": f"Tool {tool_id} started successfully"
            }
            
        except Exception as e:
            logger.error(f"Error running tool {tool_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_id": tool_id
            }

    def stop_tool(self, tool_id: str) -> Dict[str, Any]:
        """Stop a running tool"""
        if tool_id not in self.running_processes:
            return {
                "success": False,
                "error": f"Tool {tool_id} is not running",
                "tool_id": tool_id
            }

        try:
            process = self.running_processes[tool_id]
            process.terminate()
            
            # Wait for process to terminate
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                
            # Remove from running processes
            del self.running_processes[tool_id]
            
            # Update execution state
            if tool_id in self.state["tool_executions"]:
                self.state["tool_executions"][tool_id]["status"] = "stopped"
                self.state["tool_executions"][tool_id]["end_time"] = datetime.now().isoformat()
            
            self.save_state()
            
            logger.info(f"Stopped tool {tool_id}")
            
            return {
                "success": True,
                "tool_id": tool_id,
                "message": f"Tool {tool_id} stopped successfully"
            }
            
        except Exception as e:
            logger.error(f"Error stopping tool {tool_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool_id": tool_id
            }

    def get_tool_status(self, tool_id: str) -> Dict[str, Any]:
        """Get status of a specific tool"""
        if tool_id in self.running_processes:
            process = self.running_processes[tool_id]
            if process.poll() is None:
                # Process is still running
                return {
                    "tool_id": tool_id,
                    "status": "running",
                    "pid": process.pid
                }
            else:
                # Process has finished
                stdout, stderr = process.communicate()
                return_code = process.returncode
                
                # Remove from running processes
                del self.running_processes[tool_id]
                
                # Update execution state
                execution_state = self.state["tool_executions"].get(tool_id, {})
                execution_state.update({
                    "status": "completed" if return_code == 0 else "error",
                    "end_time": datetime.now().isoformat(),
                    "return_code": return_code,
                    "stdout": stdout,
                    "stderr": stderr
                })
                self.state["tool_executions"][tool_id] = execution_state
                self.save_state()
                
                return {
                    "tool_id": tool_id,
                    "status": "completed" if return_code == 0 else "error",
                    "return_code": return_code,
                    "stdout": stdout,
                    "stderr": stderr
                }
        else:
            # Check execution history
            execution_state = self.state["tool_executions"].get(tool_id, {})
            if execution_state:
                return {
                    "tool_id": tool_id,
                    "status": execution_state.get("status", "idle"),
                    **execution_state
                }
            else:
                return {
                    "tool_id": tool_id,
                    "status": "idle"
                }

    def get_all_tools_status(self) -> Dict[str, Any]:
        """Get status of all tools"""
        status = {}
        
        # Check all tools from sections
        for section in self.sections.get("sections", []):
            for tool in section.get("tools", []):
                tool_id = tool.get("id")
                if tool_id:
                    status[tool_id] = self.get_tool_status(tool_id)
        
        return status

    def simulate_duplicate_detection(self, path: str = ".") -> Dict[str, Any]:
        """Simulate duplicate detection for demonstration"""
        import random
        import time
        
        # Simulate file scanning
        file_count = random.randint(100, 1000)
        duplicates_found = random.randint(5, 50)
        space_saved = random.uniform(10.0, 500.0)
        
        # Update performance stats
        self.state["performance_stats"]["files_processed"] += file_count
        self.state["performance_stats"]["duplicates_found"] += duplicates_found
        self.state["performance_stats"]["space_saved_mb"] += space_saved
        
        self.save_state()
        
        return {
            "files_scanned": file_count,
            "duplicates_found": duplicates_found,
            "space_saved_mb": round(space_saved, 2),
            "scan_time_seconds": random.uniform(5.0, 30.0),
            "duplicate_groups": [
                {
                    "files": [f"file_{i}_copy.jpg", f"file_{i}.jpg"],
                    "size_mb": random.uniform(1.0, 10.0)
                }
                for i in range(duplicates_found // 2)
            ]
        }

    def cleanup_finished_processes(self):
        """Clean up finished processes"""
        finished_tools = []
        
        for tool_id, process in self.running_processes.items():
            if process.poll() is not None:
                finished_tools.append(tool_id)
        
        for tool_id in finished_tools:
            self.get_tool_status(tool_id)  # This will handle cleanup

    def monitor_system(self, interval: int = 5):
        """Monitor system and update metrics periodically"""
        def monitor_loop():
            while True:
                try:
                    self.get_system_metrics()
                    self.cleanup_finished_processes()
                    time.sleep(interval)
                except Exception as e:
                    logger.error(f"Error in monitor loop: {e}")
                    time.sleep(interval)
        
        monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        monitor_thread.start()
        logger.info(f"System monitoring started with {interval}s interval")

def main():
    """Main entry point for CLI usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Knoux SmartOrganizer Tool Runner")
    parser.add_argument("--run", help="Run a specific tool by ID")
    parser.add_argument("--stop", help="Stop a specific tool by ID")
    parser.add_argument("--status", help="Get status of a specific tool by ID")
    parser.add_argument("--list", action="store_true", help="List all tools status")
    parser.add_argument("--metrics", action="store_true", help="Get system metrics")
    parser.add_argument("--monitor", action="store_true", help="Start system monitoring")
    parser.add_argument("--simulate", help="Simulate duplicate detection on path")
    
    args = parser.parse_args()
    
    runner = KnouxToolRunner()
    
    if args.run:
        result = runner.run_tool(args.run)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.stop:
        result = runner.stop_tool(args.stop)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.status:
        result = runner.get_tool_status(args.status)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.list:
        result = runner.get_all_tools_status()
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.metrics:
        result = runner.get_system_metrics()
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.simulate:
        result = runner.simulate_duplicate_detection(args.simulate)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    elif args.monitor:
        print("Starting system monitoring... (Press Ctrl+C to stop)")
        runner.monitor_system()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping monitor...")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
