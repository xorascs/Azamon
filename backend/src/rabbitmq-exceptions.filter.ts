import { QueryFailedError } from 'typeorm';
import { ExceptionFilter, Catch, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';

type ResponseObj = {
  statusCode: number,
  status: string,
  timestamp: string,
  path: string,
  response: string | object,
};

@Catch()
export class RabbitMQExceptionFilter implements ExceptionFilter {
  catch(exception: unknown): ResponseObj {
    const responseObj: ResponseObj = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR, // Default to 500
      status: 'error',
      timestamp: new Date().toISOString(),
      path: 'RabbitMQ Consumer', // Indicate this is a RabbitMQ-related error
      response: 'Internal server error',
    };

    if (exception instanceof QueryFailedError) {
      if (exception.driverError?.code === '23505') {
        // Handle unique constraint violations
        responseObj.statusCode = HttpStatus.CONFLICT; // Conflict - 409
        responseObj.response = exception.driverError.detail || 'Conflicting data detected';
      }
    } else if (exception instanceof HttpException) {
      // Handle HttpExceptions (including ValidationPipe errors)
      responseObj.statusCode = exception.getStatus();
      responseObj.response = exception.getResponse();
    } else if (exception instanceof BadRequestException) {
      // Handle validation errors specifically thrown by ValidationPipe
      responseObj.statusCode = HttpStatus.BAD_REQUEST; // Bad Request - 400
      responseObj.response = this.extractValidationErrors(exception);
    } else if (exception instanceof Error) {
      // Handle generic errors
      responseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      responseObj.response = exception.message;
    } else {
      // Handle unexpected exceptions
      responseObj.response = "Unexpected error: " + JSON.stringify(exception);
    }

    // Log the error details
    console.error('RabbitMQ Exception:', responseObj);
    return responseObj;
  }

  private extractValidationErrors(exception: BadRequestException): object {
    const response = exception.getResponse() as any;

    if (typeof response === 'object' && response.message) {
      // If it's an array of validation errors, format them properly
      return {
        error: 'Validation failed',
        details: Array.isArray(response.message) ? response.message : [response.message],
      };
    } else {
      // Fallback for non-array or non-standard error responses
      return {
        error: 'Validation failed',
        details: ['Invalid input'],
      };
    }
  }
}