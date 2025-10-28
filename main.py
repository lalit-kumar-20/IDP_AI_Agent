#!/usr/bin/env python3
"""
Invoice Intelligence Agent - CLI Interface
Main entry point for the application
"""

import sys
import json
from invoice_agent import InvoiceAgent

def print_menu():
    """Print main menu"""
    print("\n" + "="*60)
    print("INVOICE INTELLIGENCE AGENT")
    print("="*60)
    print("\nCommands:")
    print("  1. process <pdf_path> <document_id>  - Process new invoice")
    print("  2. correct <correction_text>         - Apply correction to current invoice")
    print("  3. extract <field_name>              - Extract specific field")
    print("  4. show                              - Show current invoice data")
    print("  5. save <output_file>                - Save current data to JSON file")
    print("  6. vendors                           - List all vendors")
    print("  7. help                              - Show this menu")
    print("  8. exit                              - Exit application")
    print("="*60)

def print_help():
    """Print detailed help"""
    print("\n" + "="*60)
    print("📖 DETAILED HELP")
    print("="*60)
    print("\n1. PROCESS INVOICE:")
    print("   process <pdf_path> <document_id>")
    print("   Example: process sample.pdf INV001")
    print("   - Extracts text from PDF")
    print("   - Indexes in vector database")
    print("   - Parses structured data")
    print("   - Handles vendor search/creation")
    
    print("\n2. APPLY CORRECTION:")
    print("   correct <correction_text>")
    print("   Examples:")
    print("   - correct The PO number is missing, it's PO-12345")
    print("   - correct Currency is GBP not USD")
    print("   - correct Extract all line items from this invoice")
    
    print("\n3. EXTRACT SPECIFIC FIELD:")
    print("   extract <field_name>")
    print("   Examples:")
    print("   - extract po_number")
    print("   - extract line_items")
    print("   - extract payment_terms")
    
    print("\n4. SHOW CURRENT DATA:")
    print("   show")
    print("   - Displays formatted summary of current invoice")
    
    print("\n5. SAVE TO FILE:")
    print("   save <output_file>")
    print("   Example: save invoice_data.json")
    
    print("\n6. LIST VENDORS:")
    print("   vendors")
    print("   - Shows all vendors in the system")
    
    print("="*60 + "\n")

def handle_process(agent: InvoiceAgent, args: list):
    """Handle process command"""
    if len(args) < 2:
        print("[ERROR] Missing arguments")
        print("Usage: process <pdf_path> <document_id>")
        return
    
    pdf_path = args[0]
    document_id = args[1]
    
    try:
        result = agent.process_invoice(pdf_path, document_id)
        print("\n[SUCCESS] Invoice processed successfully!")
        print(f"\nDocument ID: {result['document_id']}")
        
        if result['vendor']:
            print(f"Vendor: {result['vendor']['name']} (ID: {result['vendor']['vendor_id']})")
        
        agent.print_invoice_summary()
        
    except Exception as e:
        print(f"[ERROR] Error processing invoice: {e}")

def handle_correct(agent: InvoiceAgent, args: list):
    """Handle correction command"""
    if len(args) < 1:
        print("[ERROR] Missing correction text")
        print("Usage: correct <correction_text>")
        return
    
    correction_query = ' '.join(args)
    
    try:
        result = agent.apply_correction(correction_query)
        print("\n[SUCCESS] Correction applied successfully!")
        agent.print_invoice_summary()
        
    except Exception as e:
        print(f"[ERROR] Error applying correction: {e}")

def handle_extract(agent: InvoiceAgent, args: list):
    """Handle extract field command"""
    if len(args) < 1:
        print("[ERROR] Missing field name")
        print("Usage: extract <field_name>")
        return
    
    field_name = args[0]
    context = ' '.join(args[1:]) if len(args) > 1 else None
    
    try:
        result = agent.extract_field(field_name, context)
        print(f"\n[SUCCESS] Extracted field: {field_name}")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"[ERROR] Error extracting field: {e}")

def handle_show(agent: InvoiceAgent):
    """Handle show command"""
    data = agent.get_current_data()
    
    if not data:
        print("[WARNING] No invoice currently loaded")
        print("Use 'process <pdf_path> <document_id>' to load an invoice")
        return
    
    agent.print_invoice_summary()

def handle_save(agent: InvoiceAgent, args: list):
    """Handle save command"""
    if len(args) < 1:
        print("[ERROR] Missing output file path")
        print("Usage: save <output_file>")
        return
    
    output_file = args[0]
    data = agent.get_current_data()
    
    if not data:
        print("[WARNING] No invoice data to save")
        return
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Data saved to: {output_file}")
        
    except Exception as e:
        print(f"[ERROR] Error saving file: {e}")

def handle_vendors(agent: InvoiceAgent):
    """Handle vendors command"""
    vendors = agent.vendor_manager.list_vendors()
    
    if not vendors:
        print("[WARNING] No vendors in the system")
        return
    
    print(f"\n[VENDORS] ({len(vendors)} total)")
    print("="*60)
    
    for vendor in vendors:
        print(f"\n  ID: {vendor.vendor_id}")
        print(f"  Name: {vendor.name}")
        if vendor.address:
            print(f"  Address: {vendor.address}")
        if vendor.tax_id:
            print(f"  Tax ID: {vendor.tax_id}")
        print(f"  Created: {vendor.created_at}")
        print("-" * 40)

def interactive_mode():
    """Run in interactive mode"""
    agent = InvoiceAgent()
    print_menu()
    
    while True:
        try:
            user_input = input("\n> ").strip()
            
            if not user_input:
                continue
            
            parts = user_input.split()
            command = parts[0].lower()
            args = parts[1:]
            
            if command == "exit" or command == "quit":
                print("\n[EXIT] Goodbye!")
                break
            
            elif command == "help":
                print_help()
            
            elif command == "process":
                handle_process(agent, args)
            
            elif command == "correct":
                handle_correct(agent, args)
            
            elif command == "extract":
                handle_extract(agent, args)
            
            elif command == "show":
                handle_show(agent)
            
            elif command == "save":
                handle_save(agent, args)
            
            elif command == "vendors":
                handle_vendors(agent)
            
            else:
                print(f"[ERROR] Unknown command: {command}")
                print("Type 'help' for available commands")
        
        except KeyboardInterrupt:
            print("\n\n[EXIT] Goodbye!")
            break
        except Exception as e:
            print(f"[ERROR] Error: {e}")

def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        # Command line mode
        agent = InvoiceAgent()
        command = sys.argv[1].lower()
        args = sys.argv[2:]
        
        if command == "process" and len(args) >= 2:
            handle_process(agent, args)
        elif command == "help":
            print_help()
        else:
            print("[ERROR] Invalid command line arguments")
            print("Usage: python main.py [process <pdf_path> <document_id>]")
            print("Or run without arguments for interactive mode")
    else:
        # Interactive mode
        interactive_mode()

if __name__ == "__main__":
    main()