'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Copy } from 'lucide-react';

interface FormValues {
  cidr: string;
}

export default function Home() {
  const [ipRange, setIpRange] = useState<string>('');
  const [networkMask, setNetworkMask] = useState<string>('');
  const [firstIP, setFirstIP] = useState<string>('');
  const [lastIP, setLastIP] = useState<string>('');
  const [totalIPs, setTotalIPs] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collapsibleRef.current && !collapsibleRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const form = useForm<FormValues>({
    defaultValues: {
      cidr: '',
    },
  });

  const validateCIDR = (cidr: string): boolean => {
    // 基本 CIDR 格式验证: IP/前缀长度
    const cidrPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
    if (!cidrPattern.test(cidr)) {
      return false;
    }

    // 验证 IP 地址部分的每个八位字节是否在 0-255 范围内
    const parts = cidr.split('/');
    const ipParts = parts[0].split('.');
    for (let i = 0; i < 4; i++) {
      const octet = parseInt(ipParts[i]);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    // 验证前缀长度是否在 1-32 范围内
    const prefixLength = parseInt(parts[1]);
    if (prefixLength < 0 || prefixLength > 32) {
      return false;
    }

    return true;
  };

  const convertCIDR = (cidr: string) => {
    if (!validateCIDR(cidr)) {
      toast.error('无效的 CIDR 格式，请使用如 192.168.1.0/24 的格式');
      return;
    }

    const [ipPart, prefixPart] = cidr.split('/');
    const prefixLength = parseInt(prefixPart);
    
    // 将 IP 地址转换为 32 位二进制数
    const ipOctets = ipPart.split('.').map(octet => parseInt(octet));
    let ipBinary = '';
    ipOctets.forEach(octet => {
      ipBinary += octet.toString(2).padStart(8, '0');
    });
    
    // 计算网络地址和广播地址
    const networkBinary = ipBinary.substring(0, prefixLength).padEnd(32, '0');
    const broadcastBinary = ipBinary.substring(0, prefixLength).padEnd(32, '1');
    
    // 计算第一个和最后一个可用 IP 地址
    let firstIPBinary = networkBinary;
    let lastIPBinary = broadcastBinary;
    
    // 如果不是 /31 或 /32 网络，则第一个可用 IP 是网络地址 +1，最后一个可用 IP 是广播地址 -1
    if (prefixLength < 31) {
      firstIPBinary = (BigInt('0b' + networkBinary) + 1n).toString(2).padStart(32, '0');
      lastIPBinary = (BigInt('0b' + broadcastBinary) - 1n).toString(2).padStart(32, '0');
    }
    
    // 将二进制转换回点分十进制格式
    const networkIP = binaryToIP(networkBinary);
    const broadcastIP = binaryToIP(broadcastBinary);
    const firstIPAddress = binaryToIP(firstIPBinary);
    const lastIPAddress = binaryToIP(lastIPBinary);
    
    // 计算子网掩码
    const subnetMaskBinary = '1'.repeat(prefixLength).padEnd(32, '0');
    const subnetMask = binaryToIP(subnetMaskBinary);
    
    // 计算总 IP 数量
    const totalIPAddresses = Math.pow(2, 32 - prefixLength);
    
    // 更新状态
    setIpRange(`${networkIP} - ${broadcastIP}`);
    setNetworkMask(subnetMask);
    setFirstIP(firstIPAddress);
    setLastIP(lastIPAddress);
    setTotalIPs(totalIPAddresses);
    
    toast.success('CIDR 转换成功');
  };
  
  // 辅助函数：将 32 位二进制字符串转换为点分十进制 IP 地址
  const binaryToIP = (binary: string): string => {
    const octets = [];
    for (let i = 0; i < 32; i += 8) {
      octets.push(parseInt(binary.substr(i, 8), 2));
    }
    return octets.join('.');
  };

  const onSubmit = (data: FormValues) => {
    convertCIDR(data.cidr);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('已复制到剪贴板'))
      .catch(() => toast.error('复制失败'));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">CIDR 转换器</h1>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>输入 CIDR 块</CardTitle>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <div ref={collapsibleRef}>
                <CollapsibleTrigger className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                CIDR 格式说明
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute z-50 mt-2 p-4 bg-white border rounded-lg shadow-lg w-[500px] left-1/2 -translate-x-1/2">
                <div className="relative">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center border rounded overflow-hidden">
                      <div className="bg-blue-100 px-4 py-2 border-r">
                        <code>192.168.1.0</code>
                      </div>
                      <div className="bg-green-100 px-2 py-2">
                        <code>/24</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-1">网络地址部分</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>由4个八位字节组成，以点分十进制表示</li>
                        <li>每个八位字节必须是0-255之间的整数</li>
                        <li>例如：192.168.1.0</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-600 mb-1">前缀长度部分</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>以斜杠(/)开头，表示网络前缀的位数</li>
                        <li>必须是1-32之间的整数</li>
                        <li>决定了子网的大小</li>
                        <li>例如：/24表示前24位是网络部分</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <p>示例：192.168.1.0/24 表示一个包含256个IP地址的网络，其中192.168.1.0是网络地址，192.168.1.255是广播地址</p>
                  </div>
                </div>
              </CollapsibleContent>
              </div>
            </Collapsible>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cidr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CIDR 地址</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：192.168.1.0/24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full">转换</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {ipRange && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>转换结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ip-range">IP 范围</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{ipRange}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 opacity-50 hover:opacity-100 transition-all"
                      onClick={() => handleCopyToClipboard(ipRange)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="network-mask">网络掩码</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{networkMask}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 opacity-50 hover:opacity-100 transition-all"
                      onClick={() => handleCopyToClipboard(networkMask)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="first-ip">第一个可用 IP</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{firstIP}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 opacity-50 hover:opacity-100 transition-all"
                      onClick={() => handleCopyToClipboard(firstIP)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="last-ip">最后一个可用 IP</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{lastIP}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 opacity-30 hover:opacity-100 hover:scale-110 transition-all"
                      onClick={() => handleCopyToClipboard(lastIP)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="total-ips">总 IP 数量</Label>
                <div className="flex mt-1">
                  <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{totalIPs.toString()}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 opacity-30 hover:opacity-100 hover:scale-110 transition-all"
                    onClick={() => handleCopyToClipboard(totalIPs.toString())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
