import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const testType = url.searchParams.get('type') || 'basic';
  
  console.log('🧪 Starting timeout test:', testType);
  
  try {
    switch (testType) {
      case 'basic':
        // Test basic function execution
        return NextResponse.json({
          success: true,
          message: 'Basic endpoint works',
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          platform: process.platform
        });
        
      case 'python':
        // Test if Python is available
        return new Promise<NextResponse>((resolve) => {
          const pythonStartTime = Date.now();
          
          const timeoutId = setTimeout(() => {
            resolve(NextResponse.json({
              success: false,
              error: 'Python test timeout',
              executionTime: Date.now() - startTime,
              pythonExecutionTime: Date.now() - pythonStartTime
            }, { status: 408 }));
          }, 8000);
          
          const pythonProcess = spawn('python3', ['--version']);
          let output = '';
          let errorOutput = '';
          
          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
          
          pythonProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            resolve(NextResponse.json({
              success: code === 0,
              pythonVersion: output || errorOutput,
              exitCode: code,
              executionTime: Date.now() - startTime,
              pythonExecutionTime: Date.now() - pythonStartTime
            }));
          });
          
          pythonProcess.on('error', (error) => {
            clearTimeout(timeoutId);
            resolve(NextResponse.json({
              success: false,
              error: 'Python not available',
              details: error.message,
              executionTime: Date.now() - startTime
            }));
          });
        });
        
      case 'files':
        // Test if required files exist
        const modelPath = path.join(process.cwd(), 'app', 'models', 'candidate_matcher_id_only.pkl');
        const scriptPath = path.join(process.cwd(), 'app', 'lib', 'candidate_matcher.py');
        
        const fileTests: {
          modelExists: boolean;
          scriptExists: boolean;
          modelPath: string;
          scriptPath: string;
          cwd: string;
          modelSize?: number;
        } = {
          modelExists: fs.existsSync(modelPath),
          scriptExists: fs.existsSync(scriptPath),
          modelPath,
          scriptPath,
          cwd: process.cwd()
        };
        
        if (fileTests.modelExists) {
          const stats = fs.statSync(modelPath);
          fileTests.modelSize = stats.size;
        }
        
        return NextResponse.json({
          success: true,
          fileTests,
          executionTime: Date.now() - startTime
        });
        
      case 'slow':
        // Test what happens with a slow operation (8 seconds)
        await new Promise(resolve => setTimeout(resolve, 8000));
        return NextResponse.json({
          success: true,
          message: 'Slow operation completed',
          executionTime: Date.now() - startTime
        });
        
      case 'similarity-quick':
        // Quick similarity test with minimal data
        return new Promise<NextResponse>((resolve) => {
          const pythonStartTime = Date.now();
          const modelPath = path.join(process.cwd(), 'app', 'models', 'candidate_matcher_id_only.pkl');
          const scriptPath = path.join(process.cwd(), 'app', 'lib', 'candidate_matcher.py');
          
          const queryData = {
            skills: { systems_infrastructure: 0.5, theory_statistics_ml: 0.3, product: 0.7, github_similarity: 0.0 },
            top_k: 3,
            weights: null,
            github_similarities: []
          };
          
          const timeoutId = setTimeout(() => {
            resolve(NextResponse.json({
              success: false,
              error: 'Similarity test timeout after 8 seconds',
              executionTime: Date.now() - startTime,
              pythonExecutionTime: Date.now() - pythonStartTime
            }, { status: 408 }));
          }, 8000);
          
          const pythonProcess = spawn('python3', [
            scriptPath,
            'find_similar',
            modelPath,
            JSON.stringify(queryData)
          ]);
          
          let output = '';
          let errorOutput = '';
          
          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
          
          pythonProcess.on('close', (code) => {
            clearTimeout(timeoutId);
            
            let result = null;
            try {
              result = JSON.parse(output);
            } catch (e) {
              result = { error: 'Failed to parse output', rawOutput: output };
            }
            
            resolve(NextResponse.json({
              success: code === 0 && result?.success,
              result,
              errorOutput,
              exitCode: code,
              executionTime: Date.now() - startTime,
              pythonExecutionTime: Date.now() - pythonStartTime
            }));
          });
          
          pythonProcess.on('error', (error) => {
            clearTimeout(timeoutId);
            resolve(NextResponse.json({
              success: false,
              error: 'Python process error',
              details: error.message,
              executionTime: Date.now() - startTime
            }));
          });
        });
        
      default:
        return NextResponse.json({
          error: 'Unknown test type',
          availableTests: ['basic', 'python', 'files', 'slow', 'similarity-quick']
        }, { status: 400 });
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: (error as Error).message,
      executionTime: Date.now() - startTime
    }, { status: 500 });
  }
}