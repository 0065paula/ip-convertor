'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';

import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface FormValues {
  cidr: string;
}

export default function Home() {
  const [ipRange, setIpRange] = useState<string>('');
  const [networkMask, setNetworkMask] = useState<string>('');
  const [firstIP, setFirstIP] = useState<string>('');
  const [lastIP, setLastIP] = useState<string>('');
  const [totalIPs, setTotalIPs] = useState<number>(0);

  const form = useForm<FormValues>({
    defaultValues: {
      cidr: '',
    },
  });

  const validateCIDR = (cidr: string): boolean => {
    // 基本CIDR格式验证: IP/前缀长度
    const cidrPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
    if (!cidrPattern.test(cidr)) {
      return false;
    }

    // 验证IP地址部分的每个八位字节是否在0-255范围内
    const parts = cidr.split('/');
    const ipParts = parts[0].split('.');
    for (let i = 0; i < 4; i++) {
      const octet = parseInt(ipParts[i]);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    // 验证前缀长度是否在1-32范围内
    const prefixLength = parseInt(parts[1]);
    if (prefixLength < 0 || prefixLength > 32) {
      return false;
    }

    return true;
  };

  const convertCIDR = (cidr: string) => {
    if (!validateCIDR(cidr)) {
      toast.error('无效的CIDR格式，请使用如192.168.1.0/24的格式');
      return;
    }

    const [ipPart, prefixPart] = cidr.split('/');
    const prefixLength = parseInt(prefixPart);
    
    // 将IP地址转换为32位二进制数
    const ipOctets = ipPart.split('.').map(octet => parseInt(octet));
    let ipBinary = '';
    ipOctets.forEach(octet => {
      ipBinary += octet.toString(2).padStart(8, '0');
    });
    
    // 计算网络地址和广播地址
    const networkBinary = ipBinary.substring(0, prefixLength).padEnd(32, '0');
    const broadcastBinary = ipBinary.substring(0, prefixLength).padEnd(32, '1');
    
    // 计算第一个和最后一个可用IP地址
    let firstIPBinary = networkBinary;
    let lastIPBinary = broadcastBinary;
    
    // 如果不是/31或/32网络，则第一个可用IP是网络地址+1，最后一个可用IP是广播地址-1
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
    
    // 计算总IP数量
    const totalIPAddresses = Math.pow(2, 32 - prefixLength);
    
    // 更新状态
    setIpRange(`${networkIP} - ${broadcastIP}`);
    setNetworkMask(subnetMask);
    setFirstIP(firstIPAddress);
    setLastIP(lastIPAddress);
    setTotalIPs(totalIPAddresses);
    
    toast.success('CIDR转换成功');
  };
  
  // 辅助函数：将32位二进制字符串转换为点分十进制IP地址
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
          <CardHeader>
            <CardTitle>输入CIDR块</CardTitle>
            <CardDescription>输入CIDR格式的网络地址（例如：192.168.1.0/24）</CardDescription>
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
                      <FormDescription>
                        请输入有效的CIDR格式地址
                      </FormDescription>
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
                    <Button variant="outline" className="ml-2" onClick={() => handleCopyToClipboard(ipRange)}>
                      复制
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="network-mask">网络掩码</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{networkMask}</code>
                    <Button variant="outline" className="ml-2" onClick={() => handleCopyToClipboard(networkMask)}>
                      复制
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="first-ip">第一个可用IP</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{firstIP}</code>
                    <Button variant="outline" className="ml-2" onClick={() => handleCopyToClipboard(firstIP)}>
                      复制
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="last-ip">最后一个可用IP</Label>
                  <div className="flex mt-1">
                    <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{lastIP}</code>
                    <Button variant="outline" className="ml-2" onClick={() => handleCopyToClipboard(lastIP)}>
                      复制
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="total-ips">总IP数量</Label>
                <div className="flex mt-1">
                  <code className="flex-1 block p-2 rounded bg-muted overflow-x-auto">{totalIPs.toString()}</code>
                  <Button variant="outline" className="ml-2" onClick={() => handleCopyToClipboard(totalIPs.toString())}>
                    复制
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
